import React, { useEffect, useState } from "react";
import styles from "./App.module.css";
import ListItem from"./components/ListItem"; 
import { getColonyNetworkClient, Network } from "@colony/colony-js";
import { Wallet } from "ethers";
import { InfuraProvider } from "ethers/providers";
import { getPayoutsClaimed, getColonyRoleSet, getAddedDomains, getInitializedColonies } from "./filterMethods"

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

export const provider = new InfuraProvider('mainnet', INFURA_KEY);
const wallet = Wallet.createRandom();
const connectedWallet = wallet.connect(provider);

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

    const [PayoutsClaimed,InitializedColonies, ColonyRoleSets, AddedDomains] = await Promise.all(
      [Promise.all(await getPayoutsClaimed(colonyClient)),
        Promise.all(await getInitializedColonies(colonyClient)),
        Promise.all(await getColonyRoleSet(colonyClient)),
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