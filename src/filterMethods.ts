
import {getLogs, getBlockTime, ColonyClient, ColonyRole } from "@colony/colony-js";
import { utils } from "ethers";
import { provider } from "./App"

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


export const getPayoutsClaimed = async (colonyClient: ColonyClient): Promise<PayoutClaimed[]> => {
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

export const getColonyRoleSet = async (colonyClient: ColonyClient): Promise<ColonyRoleSet[]> => {
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

export const getAddedDomains = async (colonyClient: ColonyClient): Promise<AddedDomain[]> => {
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

export const getInitializedColonies = async (colonyClient: ColonyClient): Promise<InitialzedColony[]> => {
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