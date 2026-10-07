import { useState } from "react";
import { MdHome, MdOutlineHome } from "react-icons/md";
import { VscReport } from "react-icons/vsc";
import { TbMessageReportFilled } from "react-icons/tb";
import { BsStars, BsLightningChargeFill } from "react-icons/bs";
import styles from './sidebar.module.css';

export const SidebarMain = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const handleTabClick = (tabName: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tabName);
  };

  return (
    <aside className={styles.sidebar_area}>
      <div className={styles.top_section}>
        <div className={styles.logo_area}>
          <div className={styles.logo_icon}>
            <BsStars size={24} color="#8b5cf6" />
          </div>
          <div className={styles.logo_text}>
            <h1>Metrics Report AI</h1>
            <p>Bugs mais inteligentes, produtos melhores.</p>
          </div>
        </div>

        <ul className={styles.options}>
          <li className={activeTab === 'dashboard' ? styles.active : ''}>
            <a href="/dashboard" onClick={(e) => handleTabClick('dashboard', e)}>
              {activeTab === 'dashboard' ? <MdHome size={20} /> : <MdOutlineHome size={20} />}
              <span>Dashboard</span>
            </a>
          </li>
          
          <li className={activeTab === 'issues' ? styles.active : ''}>
            <a href="/issues" onClick={(e) => handleTabClick('issues', e)}>
              <VscReport size={20} />
              <span>Issues</span>
            </a>
          </li>
          
          <li className={activeTab === 'novaIssue' ? styles.active : ''}>
            <a href="/nova-issue" onClick={(e) => handleTabClick('novaIssue', e)}>
              <TbMessageReportFilled size={20} />
              <span>Nova Issue</span>
            </a>
          </li>
        </ul>
      </div>

      <div className={styles.bottom_box}>
        <div className={styles.box_icon}>
          <BsLightningChargeFill size={20} color="#a78bfa" />
        </div>
        <div className={styles.box_content}>
          <h4>Com IA, sua equipe decide melhor.</h4>
          <p>Análises automáticas, mais clareza e foco no que importa.</p>
        </div>
      </div>
    </aside>
  );
};