import React, { useEffect, useState } from "react";
import styles from "./App.module.css";
import ListItem from"./components/ListItem"; 
import { getColonyNetworkClient, Network, getLogs, getBlockTime, ColonyClient, ColonyRole } from "@colony/colony-js";
import { Wallet, utils } from "ethers";
import { InfuraProvider } from "ethers/providers";

type PayoutClaimed = Promise<{
  amount: number
  fundingPotId: number
  token: string
  date: Date | undefined
  userAddress: string
}>

type ColonyRoleSet = Promise<{
  role: string
  domainId: number
  date: Date | undefined
  userAddress: string
}>

type AddedDomain = Promise<{
  domainId: number
  date: Date | undefined
  transactionHash: string | undefined
}>

type InitialzedColony = Promise<{
  date: Date | undefined
  title: string
  transactionHash: string | undefined
}>

type Event = {
  domainId?: number
  date: Date | undefined
  role?: string
  userAddress?: string
  amount?: number
  fundingPotId?: number
  token?: string
  title?: string
  transactionHash?: string | undefined
}

const MAINNET_NETWORK_ADDRESS = `0x5346D0f80e2816FaD329F2c140c870ffc3c3E2Ef`;
const MAINNET_BETACOLONY_ADDRESS = `0x869814034d96544f3C62DE2aC22448ed79Ac8e70`;
const INFURA_KEY = `01d13f9f876c4ce0843d47c7850f8c46`

const provider = new InfuraProvider('mainnet', INFURA_KEY);
const wallet = Wallet.createRandom();
const connectedWallet = wallet.connect(provider);

const convertNumberTenEightteen = function (hex: string): number {
  const wei = new utils.BigNumber(10);
  const humanReadableAmount = new utils.BigNumber(hex);
  const convertedAmount = humanReadableAmount.div(wei.pow(18));
  return convertedAmount.toNumber();
}

const convertNumber = function (hex: string): number {
  const humanReadableAmount = new utils.BigNumber(hex);
  return humanReadableAmount.toNumber();
}

const getDate = async (blockHash: string | undefined): Promise<Date | undefined> => {
  if(blockHash) {
    const logTime = await getBlockTime(provider, blockHash)
    const date = new Date(logTime)
    return date
  } else {
    return undefined
  } 
}

const getPayoutsClaimed = async (colonyClient: ColonyClient): Promise<PayoutClaimed[]> => {
   const eventFilter = colonyClient.filters.PayoutClaimed(null,null,null);
   const eventLogs = await getLogs(colonyClient, eventFilter);
   const parsedLogs = eventLogs.map(event => colonyClient.interface.parseLog(event));
   const userAddressPayoutClaimed = async (fundingPotId: string): Promise<string> => {
   const humanReadableFundingPotId = new utils.BigNumber(fundingPotId).toString();
   const {
     associatedTypeId,
   } = await colonyClient.getFundingPot(humanReadableFundingPotId);
   const { recipient: userAddress } = await colonyClient.getPayment(associatedTypeId);
   return userAddress
   }
   const requiredData: PayoutClaimed[] = parsedLogs.map(async (log, index) => {
     return {
       amount: convertNumberTenEightteen(log.values.amount._hex),
       fundingPotId: convertNumber(log.values.fundingPotId._hex),
       token: log.values.token,
       date:  await getDate(eventLogs[index].blockHash),
       userAddress: await userAddressPayoutClaimed(log.values.fundingPotId._hex)
     };
   });
   return requiredData
}

const getColonyRoleSets = async (colonyClient: ColonyClient): Promise<ColonyRoleSet[]> => {
  // @ts-ignore
  const eventFilter = colonyClient.filters.ColonyRoleSet(null,null,null,null);
  const eventLogs = await getLogs(colonyClient, eventFilter);
  const parsedLogs = eventLogs.map(event => colonyClient.interface.parseLog(event));
  const requiredData: ColonyRoleSet[] = parsedLogs.map(async (log, index) => {
    return {
      role: ColonyRole[log.values.role],
      domainId: convertNumber(log.values.domainId._hex),
      date: await getDate(eventLogs[index].blockHash),
      userAddress: log.values.user
    };
  });
  return requiredData
}

const getAddedDomains = async (colonyClient: ColonyClient): Promise<AddedDomain[]> => {
    const eventFilter = colonyClient.filters.DomainAdded(null);
    const eventLogs = await getLogs(colonyClient, eventFilter);
    const parsedLogs = eventLogs.map(event => colonyClient.interface.parseLog(event));
    const requiredData: AddedDomain[] = parsedLogs.map(async (log, index) => {
      return {
        domainId: convertNumber(log.values.domainId._hex),
        date: await getDate(eventLogs[index].blockHash),
        transactionHash: eventLogs[index].transactionHash
      };
    });

    return requiredData
}

const getInitializedColonies = async (colonyClient: ColonyClient): Promise<InitialzedColony[]> => {
  const eventFilter = colonyClient.filters.ColonyInitialised(null,null);
  const eventLogs = await getLogs(colonyClient, eventFilter);
  const requiredData: InitialzedColony[] = eventLogs.map(async (log) => {
    return {
      date: await getDate(log.blockHash),
      title: "Congratulations! It's a beautiful baby colony!",
      transactionHash: log.transactionHash
    };
  });

  return requiredData 
}


function App() {

  const [data, setData] = useState<Event[]>([])

  const getClient = async (): Promise<void> => {

    const networkClient = getColonyNetworkClient(
      Network.Mainnet,
      connectedWallet,
      { networkAddress: MAINNET_NETWORK_ADDRESS }
    );
 
    const colonyClient = await networkClient.getColonyClient(
      MAINNET_BETACOLONY_ADDRESS
    );

    let [PayoutsClaimed,InitializedColonies, ColonyRoleSets, AddedDomains ] = await Promise.all(
      [Promise.all(await getPayoutsClaimed(colonyClient)),
        Promise.all(await getInitializedColonies(colonyClient)),
        Promise.all(await getColonyRoleSets(colonyClient)),
        Promise.all(await getAddedDomains(colonyClient))])
    
    const FullEventsList: Event[] = (PayoutsClaimed as Event[]).concat(InitializedColonies as Event[]).concat(ColonyRoleSets as Event[]).concat(AddedDomains as Event[])

    const FullSortedEventsList = FullEventsList.sort(function(a, b) {
      if (a.date && b.date) {
        if (a.date > b.date) return -1;
        if (a.date < b.date) return 1;
        return 0;
      } else {
        return 0
      }
    });

    setData(FullSortedEventsList)
  };

  useEffect(() => {
   getClient()
  }, []);

  return (
    <>
      {data.length > 0 ? 
        <div className={styles.pageContainer}>
          <div className={styles.listContainer}>
            {data.map((event, index) => 
            <ListItem eventData={event} id={index} isLast={event === data[data.length -1]} />
            )}
          </div>
        </div>
      :
        <div className={styles.loadingContainer}>
          <text className={styles.loader}>loading...</text>
        </div>
      }
    </>
  ); 
}

export default App;
