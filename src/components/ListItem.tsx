import React from "react";
import styles from "../App.module.css";
import Identicon from "./Identicon";

type Event = {
  domainId?: number
  date: Date | undefined
  role?: string
  userAddress?: string
  amount?: number
  fundingPotId?: number
  token?: any
  title?: string
  transactionHash?: string | undefined
}

type ListItemProps = {
  id: number
  eventData: Event
  isLast?: boolean
}

const getText = function (eventData: Event): React.ReactNode {
  if(eventData.amount || eventData.amount === 0) {
    return <p>User <strong>{eventData.userAddress}</strong> claimed <strong>{eventData.amount}{getTokenSymbol(eventData.token)}</strong> payout from pot <strong>{eventData.fundingPotId}</strong></p>
  } else if (eventData.role) {
    return <p><strong>{eventData.role}</strong>  role assigned to user <strong>{eventData.userAddress}</strong> in domain <strong>{eventData.domainId}</strong></p>
  } else if (eventData.title) {
    return <p>{eventData.title}</p>
  } else if(!eventData.title && eventData.domainId) {
    return <p>Domain <strong>{eventData.domainId}</strong> added</p>
  } else {
    console.log("Whats this?:", eventData);
    <p>unknown</p>
  }
}

const getTokenSymbol = function (token: string): string {
  if (token === "0x0dd7b8f3d1fa88FAbAa8a04A0c7B52FC35D4312c") {
    return "BLNY"
  } else {
    return "DAI"
  }
}

const formatDate = function (date: Date): string {
  const dateStringArr = date.toString().split(' ')
  const formattedDate = `${dateStringArr[2]} ${dateStringArr[1]}`
  return formattedDate
}

const ListItem: React.FC<ListItemProps> = ({id, eventData, isLast }) => (
    <div key={id} className={isLast ? styles.lastListItem : styles.listItem}>
        <div className={styles.avatarContainer}>
          <Identicon opts={{seed: eventData.userAddress || eventData.transactionHash}}/>
        </div>
        <div className={styles.dataContainer}>
          <div className={styles.textContainer}>
           {getText(eventData)}
          </div>
          <div className={styles.dateContainer}>
            <p>{eventData.date && formatDate(eventData.date)}</p>
          </div>
        </div>
    </div>
)

export default ListItem;