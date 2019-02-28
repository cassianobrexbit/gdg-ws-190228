import Eth from "web3-eth";
import Utils from "web3-utils";

async function getERC20TransactionsByAddress({
  tokenContractAddress,
  tokenDecimals,
  address,
  fromBlock
}) {
  // initialize the ethereum client
  const eth = new Eth(
    Eth.givenProvider || "ws://some.local-or-remote.node:8546"
  );

  const currentBlockNumber = await eth.getBlockNumber();
  // if no block to start looking from is provided, look at tx from the last day
  // 86400s in a day / eth block time 10s ~ 8640 blocks a day
  if (!fromBlock) fromBlock = currentBlockNumber - 8640;

  const contract = new eth.Contract(standardAbi, tokenContractAddress);
  const transferEvents = await contract.getPastEvents("Transfer", {
    fromBlock,
    filter: {
      isError: 0,
      txreceipt_status: 1
    },
    topics: [
      Utils.sha3("Transfer(address,address,uint256)"),
      null,
      Utils.padLeft(address, 64)
    ]
  });

  return transferEvents
    .sort((evOne, evTwo) => evOne.blockNumber - evTwo.blockNumber)
    .map(({ blockNumber, transactionHash, returnValues }) => {
      return {
        transactionHash,
        confirmations: currentBlockNumber - blockNumber,
        amount: returnValues._value * Math.pow(10, -tokenDecimals)
      };
    });
}