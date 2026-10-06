import { useState } from "react";
import { MdHome, MdOutlineHome } from "react-icons/md";
import { RiAlarmWarningFill } from "react-icons/ri";
import { VscReport } from "react-icons/vsc";
import { TbMessageReportFilled } from "react-icons/tb";
import { GiDeathStar } from "react-icons/gi";
import styles from './sidebar.module.css';


const sidebar = () => {
  const [homeIcon, setHomeIcon] = useState<boolean>(false);
  const [reportIcon, setReportIcon] = useState<boolean>(false);


  return (
    <aside className={styles.sidebar_area}>
      <div className={styles.features_options}>  
        <div>
            <h1> <GiDeathStar color="purple"/> Metrics Report AI</h1>
        </div>

        <div>
            <ul>
                <li>
                    <a href="">{homeIcon ? <MdOutlineHome /> : <MdHome /> }  Dashboard</a>
                </li>
                <li>
                    <a href=""> <RiAlarmWarningFill /> Issues</a>
                </li>
                <li>
                    <a href="" onClick={() => setReportIcon(true)}>{reportIcon ? <TbMessageReportFilled /> : <VscReport /> }New Issue</a>
                </li>
            </ul>
        </div>        
      </div>

      <div> 
        <div>
            <p>Com IA, sua equipe decide melhor.</p>
        </div>
      </div>

    </aside>
  )
}

export default sidebar