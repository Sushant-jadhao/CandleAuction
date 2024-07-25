const CandleAuction = artifacts.require("CandleAuction");

module.exports = function (deployer) {
  // Define the parameters for the constructor
  const auctionDuration = 86400; // Example: 1 day in seconds
  const candleDuration = 3600; // Example: 1 hour in seconds
  const productName = "Candle";

  // Deploy the contract with parameters
  deployer.deploy(CandleAuction, auctionDuration, candleDuration, productName);
};
