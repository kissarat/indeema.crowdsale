pragma solidity ^0.4.24;


import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract WAS_CrowdsaleReservations {
  using SafeMath for uint256;

  uint256 public reserveTokensTeamPercent = 5;  //  13013033 tokens
  uint256 public reservedTokensTeam;

  uint256 public tokensCrowdsalePurchased;
  uint256 public reservedTokensCrowdsalePurchase;

  /**
   * @param _totalSupply Maximum token unit amount
   */
  constructor(uint256 _totalSupply) public {
    calculateReservations(_totalSupply);
  }

  /**
   * @dev Calculates and sets token reservations.
   */
  function calculateReservations(uint256 _totalSupply) private {
    reservedTokensTeam = _totalSupply.mul(reserveTokensTeamPercent).div(100);
    reservedTokensCrowdsalePurchase = 50 * (10**6); //  50m
  }
}
