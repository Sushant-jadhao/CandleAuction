// src/web3.js
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";

const getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      try {
        await provider.request({ method: "eth_requestAccounts" });
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    } else {
      reject("Please install MetaMask!");
    }
  });

export default getWeb3;
