pragma solidity ^0.4.24;


import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract WAS_CrowdsaleReservations {
  using SafeMath for uint256;

  uint256 public reserveTokensTeamPercent = 5;
  uint256 public reserveTokensTeam;

  constructor(uint256 _totalSupply) public {
    calculateReservations(_totalSupply);
  }

  function calculateReservations(uint256 _totalSupply) private {
    reserveTokensTeam = _totalSupply.mul(reserveTokensTeamPercent).div(100);
  }
}
