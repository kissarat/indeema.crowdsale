pragma solidity ^0.4.24;


import "./WAS_Token.sol";
import "./WAS_CrowdsaleReservations.sol";

import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/validation/WhitelistedCrowdsale.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import "../node_modules/openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol";

contract WAS_Crowdsale is FinalizableCrowdsale, WhitelistedCrowdsale, Destructible, Pausable, WAS_CrowdsaleReservations {
  WAS_Token token;

  constructor(uint256 _rate, address _wallet, ERC20 _token, uint256[] _openingClosingTimings) 
  Crowdsale(_rate, _wallet, _token)
  TimedCrowdsale(_openingClosingTimings[0], _openingClosingTimings[1])
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


  /**
   * @dev Can be overridden to add finalization logic. The overriding function
   * should call super.finalization() to ensure the chain of finalization is
   * executed entirely.
   */
  function finalization() internal {
    token.burnUnsoldTokens();
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
  {
    super._preValidatePurchase(_beneficiary, _weiAmount);
  }
  

}
