pragma solidity ^0.4.24;


import "./WAS_CrowdsaleReservations.sol";
import "../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract WAS_Crowdsale_Stages is WAS_CrowdsaleReservations, Ownable {
  uint256[] rateETH;
  uint256[] openingTimings;
  uint256[] closingTimings;
  uint256[] stagePurchaseTokensMinimum;

  constructor(uint256[] _rateETH, uint256[] _openingTimings, uint256[] _closingTimings) public {
    validateRates(_rateETH);
    validateOpeningAndClosingTimings(_openingTimings, _closingTimings);

    rateETH = _rateETH;
    openingTimings = _openingTimings;
    closingTimings = _closingTimings;
    stagePurchaseTokensMinimum = [0, 100];
  }

  /**
   * @dev Determines rateETH for current stage.
   * @return Current rateETH
   */
  function currentRateETH() public view returns (uint256) {
    uint256 stage = currentStage();
    return rateETH[stage];
  }

  /**
   * @dev Determines discount for current stage.
   * @param _tokenPurchasedAmount Token amount based on rate ETH (base token amount)
   * @return Current discount
   */
  function currentDiscount(uint256 _tokenPurchasedAmount) public view returns (uint256) {
    uint256 stage = currentStage();

    return discountPercentForStage(stage, _tokenPurchasedAmount);
  }

  /**
   * @dev Determines current stage. Throws if no stage is currently open.
   * @return Current stage
   */
  function currentStage() public view returns (uint256) {
    for (uint256 i = 0; i < closingTimings.length; i ++) {
      if (block.timestamp <= closingTimings[i]) {
        require(block.timestamp >= openingTimings[i], "now is not in single stage range");

        return i;
      }
    }

    revert();
  }

  function updateStageRateETH(uint256 _stage, uint256 _rateETH) public onlyOwner {
    rateETH[_stage] = _rateETH;
  } 

  function updateOpeningAndClosingTimings(uint256[] _openingTimings, uint256[] _closingTimings) public onlyOwner {
    validateOpeningAndClosingTimings(_openingTimings, _closingTimings);

    openingTimings = _openingTimings;
    closingTimings = _closingTimings;
  }


  /**
   *  PRIVATE
   */

   /**
   * @dev Validates rates.
   */
  function validateRates(uint256[] _rateETH) private pure {
    for (uint256 i = 0; i < _rateETH.length; i ++) {
      require(_rateETH[i] > 0, "rate must be > 0");
    }
  }
  
  /**
   * @dev Validates opening and closing times.
   */
  function validateOpeningAndClosingTimings(uint256[] _openingTimings, uint256[] _closingTimings) private view {
    require(_openingTimings.length == _closingTimings.length, "timings length differs");
    require(_openingTimings[0] > block.timestamp, "should open in future");

    for (uint256 i = 0; i < _openingTimings.length; i ++) {
      require(_closingTimings[i] > _openingTimings[i], "closing time of stage must be > opening time of same stage");

      if (i > 0) {
        require(_openingTimings[i] > _openingTimings[i-1], "opening time must be > than previous opening time");
      }
    }
  }

  /**
   * @dev Determines discount for current stage based on parameters.
   * @param _stage Current stage idx
   * @param _tokenPurchasedAmount Tokens to be purchased for rateETH
   * @return Current discount
   */
  function discountPercentForStage(uint256 _stage, uint256 _tokenPurchasedAmount) private pure returns (uint256) {
    if (_stage == 0) {
      return 30;
    } else if (_stage == 1) {
        if (_tokenPurchasedAmount >= 15000) {
          return 10;
        } else if (_tokenPurchasedAmount >= 10000) {
          return 7;
        } else if (_tokenPurchasedAmount >= 5000) {
          return 5;
        }
    }
    return 0;
  }
}
