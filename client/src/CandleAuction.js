import React, { useState, useEffect } from "react";
import getWeb3 from "./web3";
import CandleAuctionContract from "./CandleAuction.json";
import "bootstrap/dist/css/bootstrap.min.css";
import "./CandleAuction.css"; // Import custom CSS

const CandleAuction = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [highestBid, setHighestBid] = useState("0");
  const [highestBidder, setHighestBidder] = useState("");
  const [bidderAddress, setBidderAddress] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [productName, setProductName] = useState("");
  const [auctionDuration, setAuctionDuration] = useState("");
  const [candleDuration, setCandleDuration] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [bidders, setBidders] = useState([]);
  const [auctionStatus, setAuctionStatus] = useState("");
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [displayHighestBidder, setDisplayHighestBidder] = useState("");
  const [displayHighestBid, setDisplayHighestBid] = useState("");
  const [winner, setWinner] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccounts(accounts);

        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = CandleAuctionContract.networks[networkId];
        const instance = new web3Instance.eth.Contract(
          CandleAuctionContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        setContract(instance);

        // Fetch initial data
        const highestBid = await instance.methods.highestBid().call();
        setHighestBid(web3Instance.utils.fromWei(highestBid, "ether"));

        const highestBidder = await instance.methods.highestBidder().call();
        setHighestBidder(highestBidder);

        const productName = await instance.methods.productName().call();
        setProductName(productName);

        const auctionDuration = await instance.methods.auctionDuration().call();
        setAuctionDuration(auctionDuration);

        const candleDuration = await instance.methods.candleDuration().call();
        setCandleDuration(candleDuration);

        const ended = await instance.methods.ended().call();
        setAuctionEnded(ended);

        if (ended) {
          const winner = await instance.methods.getWinner().call();
          setWinner(winner);
          setDisplayHighestBid(
            web3Instance.utils.fromWei(
              await instance.methods.highestBid().call(),
              "ether"
            )
          );
          setDisplayHighestBidder(winner);
        }

        const isActive = await instance.methods.isAuctionActive().call();
        setAuctionStatus(isActive ? "Active" : "Not Active");

        const bidders = await Promise.all(
          (
            await instance.methods.bidders().call()
          ).map(async (bidder) => {
            return {
              address: bidder.addr,
              maxBid: web3Instance.utils.fromWei(bidder.maxBid, "ether"),
            };
          })
        );
        setBidders(bidders);
      } catch (error) {
        console.error("Error loading web3, accounts, or contract:", error);
      }
    };

    init();
  }, []);

  const handleBid = async () => {
    try {
      await contract.methods
        .registerBid(bidderAddress, web3.utils.toWei(bidAmount, "ether"))
        .send({ from: accounts[0] });

      // Refresh data
      const highestBid = await contract.methods.highestBid().call();
      setHighestBid(web3.utils.fromWei(highestBid, "ether"));

      const highestBidder = await contract.methods.highestBidder().call();
      setHighestBidder(highestBidder);

      // Fetch updated bidders
      const bidders = await Promise.all(
        (
          await contract.methods.bidders().call()
        ).map(async (bidder) => {
          return {
            address: bidder.addr,
            maxBid: web3.utils.fromWei(bidder.maxBid, "ether"),
          };
        })
      );
      setBidders(bidders);
    } catch (error) {
      console.error("Error making bid:", error);
    }
  };

  const handleEndAuction = async () => {
    try {
      await contract.methods.endAuction().send({ from: accounts[0] });
      setAuctionEnded(true);

      // Refresh data
      const highestBid = await contract.methods.highestBid().call();
      const highestBidder = await contract.methods.highestBidder().call();

      setDisplayHighestBid(web3.utils.fromWei(highestBid, "ether"));
      setDisplayHighestBidder(highestBidder);

      // Set winner
      setWinner(highestBidder);
    } catch (error) {
      console.error("Error ending auction:", error);
    }
  };

  const handleRestartAuction = async () => {
    try {
      await contract.methods
        .restartAuction(
          auctionDuration, // Assuming auctionDuration is in seconds
          candleDuration, // Assuming candleDuration is in seconds
          productName
        )
        .send({ from: accounts[0] });

      // Refresh data
      setProductName(productName);
      setAuctionEnded(false);
      setWinner("");
      setDisplayHighestBid("");
      setDisplayHighestBidder("");
    } catch (error) {
      console.error("Error restarting auction:", error);
    }
  };

  const handleSetProductName = async () => {
    try {
      await contract.methods
        .setProductName(newProductName)
        .send({ from: accounts[0] });

      // Refresh product name
      const productName = await contract.methods.productName().call();
      setProductName(productName);
    } catch (error) {
      console.error("Error setting product name:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Candle Auction</h2>
      <div className="mb-4">
        <p>
          <strong>Product Name:</strong> {productName}
        </p>
        <p>
          <strong>Highest Bid:</strong> {highestBid} ETH
        </p>
        <p>
          <strong>Highest Bidder:</strong> {highestBidder || "None"}
        </p>
        <p>
          <strong>Auction Status:</strong> {auctionStatus}
        </p>
        {auctionEnded && (
          <>
            <p>
              <strong>Winner:</strong> {winner || "Not Determined"}
            </p>
            <p>
              <strong>Display Highest Bid:</strong> {displayHighestBid} ETH
            </p>
            <p>
              <strong>Display Highest Bidder:</strong>{" "}
              {displayHighestBidder || "None"}
            </p>
          </>
        )}
      </div>

      <div className="mb-4">
        <h3>Set Auction Parameters</h3>
        <div className="form-group">
          <input
            type="number"
            className="form-control mb-2"
            value={auctionDuration}
            onChange={(e) => setAuctionDuration(e.target.value)}
            placeholder="Auction Duration (seconds)"
          />
          <input
            type="number"
            className="form-control mb-2"
            value={candleDuration}
            onChange={(e) => setCandleDuration(e.target.value)}
            placeholder="Candle Duration (seconds)"
          />
          <input
            type="text"
            className="form-control mb-2"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            placeholder="New Product Name"
          />
          <button
            className="btn btn-primary mb-2"
            onClick={handleSetProductName}
          >
            Set Product Name
          </button>
          <button className="btn btn-success" onClick={handleRestartAuction}>
            Set Parameters & Restart Auction
          </button>
        </div>
      </div>

      <div className="mb-4">
        <h3>Make a Bid</h3>
        <div className="form-group">
          <input
            type="text"
            className="form-control mb-2"
            value={bidderAddress}
            onChange={(e) => setBidderAddress(e.target.value)}
            placeholder="Bidder's address"
          />
          <input
            type="number"
            className="form-control mb-2"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            placeholder="Bid amount in ETH"
          />
          <button className="btn btn-primary" onClick={handleBid}>
            Place Bid
          </button>
        </div>
      </div>

      {!auctionEnded && (
        <div className="mb-4">
          <h3>End Auction</h3>
          <button className="btn btn-danger" onClick={handleEndAuction}>
            End Auction
          </button>
        </div>
      )}

      <div>
        <h3>Registered Bidders</h3>
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Address</th>
              <th>Max Bid (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {bidders.map((bidder, index) => (
              <tr key={index}>
                <td>{bidder.address}</td>
                <td>{bidder.maxBid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandleAuction;
