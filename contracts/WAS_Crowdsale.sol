pragma solidity ^0.4.24;


import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Destructible.sol";

import "./WAS_Token.sol";
import "./WAS_CrowdsaleReservations.sol";
import "../node_modules/openzeppelin-solidity/contracts/lifecycle/Pausable.sol";

contract WAS_Crowdsale is Destructible, Pausable, WAS_CrowdsaleReservations {
  WAS_Token token;

  constructor(WAS_Token _token) WAS_CrowdsaleReservations(_token.totalSupply()) public {
    require(_token != address(0), "token address cannt be 0");

    token = WAS_Token(_token);

    uint256 purchaseTokens = token.totalSupply().sub(reserveTokensTeam);

    token.mint(address(this), purchaseTokens);
    token.finishMinting();
  }

}
