pragma solidity ^0.4.24;


import "./WAS_CrowdsaleReservations.sol";


contract WAS_Crowdsale_Stages is WAS_CrowdsaleReservations {
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

  function anyStageRunning() public view returns (bool) {
    return currentStage() >= 0;
  } 

  function currentRateETH() public view returns (uint256) {
    uint256 stage = currentStage();
    return rateETH[stage];
  }

  function currentDiscount(uint256 _tokenPurchasedAmount) public view returns (uint256) {
    uint256 stage = currentStage();

    return discountPercentForStage(stage, _tokenPurchasedAmount);
  }

  function currentStage() public view returns (uint256) {
    for (uint256 i = 0; i < closingTimings.length; i ++) {
      if (block.timestamp <= closingTimings[0]) {
        require(block.timestamp >= openingTimings[0], "now is not in single stage range");

        return i;
      }
    }

    revert();
  }

  function updateStageRateETH(uint256 _stage, uint256 _rateETH) public onlyOwner {
    rateETH[_stage] = _rateETH;
  } 


  /**
   *  PRIVATE
   */
  function validateRates(uint256[] _rateETH) private pure {
    for (uint256 i = 0; i < _rateETH.length; i ++) {
      require(_rateETH[i] > 0, "rate must be > 0");
    }
  }
  
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
