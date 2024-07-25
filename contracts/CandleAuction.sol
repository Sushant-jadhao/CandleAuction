// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CandleAuction {
    address public highestBidder;
    uint public highestBid;
    address public owner;
    uint public startTime;
    uint public endTime;
    uint public candleEndTime;
    bool public ended;
    string public productName;
    uint public auctionDuration;
    uint public candleDuration;

    struct Bidder {
        address addr;
        uint maxBid;
    }

    Bidder[] public bidders;

    mapping(address => uint) public bids;

    event AuctionEnded(address winner, uint highestBid);
    event NewHighestBid(address bidder, uint amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    modifier auctionActive() {
        require(block.timestamp < endTime && !ended, "Auction is not active.");
        _;
    }

    constructor(uint _auctionDuration, uint _candleDuration, string memory _productName) {
        owner = msg.sender;
        auctionDuration = _auctionDuration;
        candleDuration = _candleDuration;
        productName = _productName;
        startTime = block.timestamp;
        endTime = startTime + _auctionDuration;
        candleEndTime = endTime - _candleDuration;
    }

    function registerBid(address _bidder, uint _maxBid) external onlyOwner auctionActive {
        bidders.push(Bidder({
            addr: _bidder,
            maxBid: _maxBid
        }));
    }

    function startAuction() external onlyOwner auctionActive {
        require(!ended, "Auction has already ended.");
        require(bidders.length > 0, "No bidders to start auction.");

        for (uint i = 0; i < bidders.length; i++) {
            if (bidders[i].maxBid > highestBid) {
                if (highestBid != 0) {
                    bids[highestBidder] += highestBid; // Refund the previous highest bidder
                }
                highestBid = bidders[i].maxBid;
                highestBidder = bidders[i].addr;
                emit NewHighestBid(bidders[i].addr, bidders[i].maxBid);
            }
        }

        if (block.timestamp >= candleEndTime) {
            if (random() % 2 == 0) {
                endAuction();
            }
        }
    }

    function withdraw() external {
        uint amount = bids[msg.sender];
        require(amount > 0, "No funds to withdraw.");
        bids[msg.sender] = 0;

        payable(msg.sender).transfer(amount);
    }

    function endAuction() public onlyOwner {
        require(!ended, "Auction has already ended.");
        ended = true;

        emit AuctionEnded(highestBidder, highestBid);

        payable(owner).transfer(highestBid);
    }

    function restartAuction(uint _auctionDuration, uint _candleDuration, string memory _productName) public onlyOwner {
        require(ended, "Auction must end before restarting.");
        auctionDuration = _auctionDuration;
        candleDuration = _candleDuration;
        productName = _productName;
        startTime = block.timestamp;
        endTime = startTime + _auctionDuration;
        candleEndTime = endTime - _candleDuration;
        ended = false;
        highestBid = 0;
        highestBidder = address(0);
        delete bidders; // Reset bidders
    }

    function setProductName(string memory _productName) public onlyOwner {
        productName = _productName;
    }

    function getHighestBid() external view returns (uint) {
        return highestBid;
    }

    function getHighestBidder() external view returns (address) {
        return highestBidder;
    }

    function getWinner() external view returns (address) {
        require(ended, "Auction has not ended yet.");
        return highestBidder;
    }

    function getAuctionStatus() external view returns (bool) {
        return block.timestamp < endTime && !ended;
    }

    function getAuctionDetails() external view returns (string memory, uint, uint, uint, uint, bool) {
        return (
            productName,
            auctionDuration,
            candleDuration,
            startTime,
            endTime,
            ended
        );
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.prevrandao, block.timestamp)));
    }
}
