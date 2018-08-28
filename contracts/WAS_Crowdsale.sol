pragma solidity ^0.4.24;


import "./WAS_Token.sol";
import "./WAS_Crowdsale_Stages.sol";

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";

contract WAS_Crowdsale is FinalizableCrowdsale, WhitelistedCrowdsale, Destructible, Pausable, WAS_Crowdsale_Stages {
  WAS_Token token;

  /**
   * @dev Reverts if not in crowdsale time range.
   */
  modifier onlyWhileOpen {
    // solium-disable-next-line security/no-block-members
    require(currentStage() >= 0, "no stages are running now");
    _;
  }

  constructor(address _wallet, ERC20 _token, uint256[] _rateETH, uint256[] _openingTimings, uint256[] _closingTimings) 
  Crowdsale(1, _wallet, _token)
  TimedCrowdsale(_openingTimings[0], _closingTimings[_closingTimings.length - 1])
  WAS_Crowdsale_Stages(_rateETH, _openingTimings, _closingTimings)
  WAS_CrowdsaleReservations(WAS_Token(_token).totalSupplyLimit())
  public {
    require(_token != address(0), "token address cannt be 0");

    token = WAS_Token(_token);
  }

  function mintTotalSupplyAndTeam(address _teamAddress) public onlyOwner {
    require(_teamAddress != address(0), "team address can not be 0");
    require(reservedTokensTeam > 0, "team tokens can not be 0");

    token.mint(_teamAddress, reservedTokensTeam);

    uint256 purchaseTokens = token.totalSupplyLimit().sub(reservedTokensTeam);
    token.mint(address(this), purchaseTokens);

    token.finishMinting();
  }

  function hasOpened() public view returns (bool) {
    return now >= openingTime;
  }

  function updateOpeningTime(uint256 _time) public onlyOwner {
    require(_time > now);
    require(!hasOpened(), "can not modify opening time after opening");
    openingTime = _time;
  }

  function updateClosingTime(uint256 _time) public onlyOwner {
    require(_time > openingTime, "closing time should be after opening time");
    closingTime = _time;
  }

  function manualTransfer(address _to, uint256 _tokenAmount) public onlyOwner {
    require(tokensCrowdsalePurchased.add(_tokenAmount) <= reservedTokensCrowdsalePurchase, "not enough tokens to manually transfer");
    tokensCrowdsalePurchased = tokensCrowdsalePurchased.add(_tokenAmount);

    token.transfer(_to, _tokenAmount);
  }


  /**
   * @dev Can be overridden to add finalization logic. The overriding function
   * should call super.finalization() to ensure the chain of finalization is
   * executed entirely.
   */
  function finalization() internal {
    uint256 unpurchasedTokens = token.balanceOf(address(this));
    token.transfer(owner, unpurchasedTokens);

    super.finalization();
  }

   /**
   * @dev Transfers the current balance to the owner and terminates the contract.
   */
  function destroy() public onlyOwner {
    require(hasClosed(), "crowdsale must be closed");
    require(isFinalized, "crowdsale must be finalized");

    selfdestruct(owner);
  }

  function destroyAndSend(address _recipient) public onlyOwner {
    require(hasClosed(), "crowdsale must be closed");
    require(isFinalized, "crowdsale must be finalized");

    selfdestruct(_recipient);
  }


  /**
   * @dev Extend parent behavior requiring crowdsale to be unpaused.
   * @param _beneficiary Token beneficiary
   * @param _weiAmount Amount of wei contributed
   */
  function _preValidatePurchase(
    address _beneficiary,
    uint256 _weiAmount
  )
    internal
    whenNotPaused()
    onlyWhileOpen()
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }

  /**
   * @dev Override to extend the way in which ether is converted to tokens.
   * @param _weiAmount Value in wei to be converted into tokens
   * @return Number of tokens that can be purchased with the specified _weiAmount
   */
  function _getTokenAmount(uint256 _weiAmount)
    internal view returns (uint256)
  {
    uint256 rateETH = currentRateETH();
    return _weiAmount.mul(rateETH).div(uint256(10*(10**18)));
  }
  
  /**
   * @dev Executed when a purchase has been validated and is ready to be executed. Not necessarily emits/sends tokens.
   * @param _beneficiary Address receiving the tokens
   * @param _tokenAmount Number of tokens to be purchased
   */
  function _processPurchase(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    require(_tokenAmount >= stagePurchaseTokensMinimum[currentStage()], "token amount is less than minimum for stage");

    require(tokensCrowdsalePurchased.add(_tokenAmount) <= reservedTokensCrowdsalePurchase, "not enough tokens to purchase");
    tokensCrowdsalePurchased = tokensCrowdsalePurchased.add(_tokenAmount);

    super._processPurchase(_beneficiary, _tokenAmount);
  }

}
