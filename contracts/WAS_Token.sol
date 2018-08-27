pragma solidity ^0.4.24;


import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

 
contract WAS_Token is MintableToken, DetailedERC20 {
    uint256 public totalSupplyLimit = 260260676;

    constructor() DetailedERC20("Wasi", "WAS", 0) public {

    }

    function burnUnsoldTokens() public onlyOwner {
        balances[owner] = 0;
    }
}