pragma solidity ^0.4.24;


import "./WAS_Token.sol";
import "./WAS_Crowdsale_Stages.sol";

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Destructible.sol";

contract WAS_Crowdsale is WhitelistedCrowdsale, Destructible, Pausable, WAS_Crowdsale_Stages {
  WAS_Token token;

  /**
   * @param _wallet Address where collected funds will be forwarded to
   * @param _token Address of the token being sold
   * @param _rateETH Number of token units a buyer gets per ETH for each stage
   * @param _openingTimings Crowdsale stages opening time
   * @param _closingTimings Crowdsale stages closing time
   */
  constructor(address _wallet, ERC20 _token, uint256[] _rateETH, uint256[] _openingTimings, uint256[] _closingTimings) 
  Crowdsale(1, _wallet, _token)
  WAS_Crowdsale_Stages(_rateETH, _openingTimings, _closingTimings)
  WAS_CrowdsaleReservations(WAS_Token(_token).totalSupplyLimit())
  public {
    require(_token != address(0), "token address cannt be 0");

    token = WAS_Token(_token);
  }

  /**
   * @dev Mints tokens to team address.
   */
  function mintTotalSupplyAndTeam(address _teamAddress) public onlyOwner {
    require(_teamAddress != address(0), "team address can not be 0");
    require(reservedTokensTeam > 0, "team tokens can not be 0");

    token.mint(_teamAddress, reservedTokensTeam);

    uint256 purchaseTokens = token.totalSupplyLimit().sub(reservedTokensTeam);
    token.mint(address(this), purchaseTokens);

    token.finishMinting();
  }

  /**
   * @dev Manually transfers tokens.
   */
  function manualTransfer(address _to, uint256 _tokenAmount) public onlyOwner {
    bool stageRunning;
    uint256 stageIdx;
    (stageRunning, stageIdx) = currentStage();

    require(stageRunning, "no stage is currently running");
    require(stageIdx == 0, "manual transfer allowed during first stage only");
    require(tokensCrowdsalePurchased.add(_tokenAmount) <= reservedTokensCrowdsalePurchase, "not enough tokens to manually transfer");
    tokensCrowdsalePurchased = tokensCrowdsalePurchased.add(_tokenAmount);

    token.transfer(_to, _tokenAmount);
  }

   /**
   * @dev Transfers the current balance to the owner and terminates the contract.
   */
  function destroy() public onlyOwner {
    require(hasClosed(), "crowdsale must be closed");
    require(isFinalized, "crowdsale must be finalized");

    selfdestruct(owner);
  }

  /**
   * @dev Transfers the current balance to the owner and terminates the recipient contract.
   * @param _recipient Recipient address for funds
   */
  function destroyAndSend(address _recipient) public onlyOwner {
    require(hasClosed(), "crowdsale must be closed");
    require(isFinalized, "crowdsale must be finalized");

    selfdestruct(_recipient);
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
    uint256 tokens = _weiAmount.mul(rateETH).div(uint256(10**18));
    uint256 discount = currentDiscount(tokens);
    if (discount > 0) {
      tokens =  tokens.add(tokens.mul(discount).div(100));
    }
    return tokens;
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
    bool stageRunning;
    uint256 stageIdx;
    (stageRunning, stageIdx) = currentStage();

    require(stageRunning, "no stage is currently running");
    require(_tokenAmount >= stagePurchaseTokensMinimum[stageIdx], "token amount is less than minimum for stage");

    require(tokensCrowdsalePurchased.add(_tokenAmount) <= reservedTokensCrowdsalePurchase, "not enough tokens to purchase");
    tokensCrowdsalePurchased = tokensCrowdsalePurchased.add(_tokenAmount);

    super._processPurchase(_beneficiary, _tokenAmount);
  }

}
