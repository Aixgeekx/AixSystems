// 应用路由根 - 锁屏守卫化 + 新增页面
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useReminder } from '@/hooks/useReminder';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useSettingsStore } from '@/stores/settingsStore';
import { seedIfEmpty } from '@/db/seed';
import { THEMES } from '@/config/themes';
import { ROUTES } from '@/config/routes';

import Layout from '@/components/Layout';
import MyDay from '@/pages/today/MyDay';
import MyWeek from '@/pages/today/MyWeek';
import MyMonth from '@/pages/today/MyMonth';
import MyYear from '@/pages/today/MyYear';
import All from '@/pages/matter/All';
import Schedule from '@/pages/matter/Schedule';
import CheckList from '@/pages/matter/CheckList';
import Importance from '@/pages/matter/Importance';
import Repeat from '@/pages/matter/Repeat';
import Memo from '@/pages/memo';
import Diary from '@/pages/diary';
import Focus from '@/pages/focus';
import ThemeSkin from '@/pages/themeskin';
import System from '@/pages/systemsetting';
import DataIO from '@/pages/dataio';
import Feedback from '@/pages/feedback';
import User from '@/pages/user';
import Search from '@/pages/search';
import Help from '@/pages/help';
import Desktop from '@/pages/desktop';
import AppLock from '@/pages/applicationlock';
import Unlock from '@/pages/applicationlock/Unlock';
import Classify from '@/pages/classify';
import Trash from '@/pages/trash';
import NewcomerGuide from '@/pages/help/Guide';
import Characteristic from '@/pages/help/Characteristic';
import NewFeatures from '@/pages/help/NewFeatures';
import Functions from '@/pages/functions';
import Syllabus from '@/pages/syllabus';
import Aunt from '@/pages/aunt';
import Loan from '@/pages/loan';
import MenuSort from '@/pages/menusort';

function AppShell() {                                           // 路由表 + 提醒 + 热键
  useReminder();
  useHotkeys();
  const nav = useNavigate();
  const loc = useLocation();
  const appLocked = useSettingsStore(s => s.appLocked);
  const startPage = useSettingsStore(s => s.startPage) || ROUTES.TODAY_DAY;

  useEffect(() => {
    const unlocked = sessionStorage.getItem('unlocked') === '1';
    if (appLocked && !unlocked && !loc.pathname.startsWith('/unlock')) {
      nav('/unlock', { replace: true });
    }
  }, [appLocked, loc.pathname, nav]);

  return (
    <Routes>
      <Route path="/unlock" element={<Unlock />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={startPage} replace />} />
        <Route path="home" element={<Navigate to={startPage} replace />} />
        <Route path="home/today/myDay" element={<MyDay />} />
        <Route path="home/today/myWeek" element={<MyWeek />} />
        <Route path="home/today/myMonth" element={<MyMonth />} />
        <Route path="home/today/myYear" element={<MyYear />} />
        <Route path="home/matter/all" element={<All />} />
        <Route path="home/matter/schedule" element={<Schedule />} />
        <Route path="home/matter/checkList" element={<CheckList />} />
        <Route path="home/matter/importance" element={<Importance />} />
        <Route path="home/matter/repeat" element={<Repeat />} />
        <Route path="home/memo" element={<Memo />} />
        <Route path="home/diary/calendar" element={<Diary />} />
        <Route path="home/diary/list" element={<Diary />} />
        <Route path="home/absorbed/tomatoAbsorbed" element={<Focus />} />
        <Route path="home/applicationlock" element={<AppLock />} />
        <Route path="home/desktop/dayPlugin" element={<Desktop />} />
        <Route path="home/themeskin" element={<ThemeSkin />} />
        <Route path="home/systemsetting" element={<System />} />
        <Route path="home/feedback" element={<Feedback />} />
        <Route path="home/user" element={<User />} />
        <Route path="home/classify" element={<Classify />} />
        <Route path="home/trash" element={<Trash />} />
        <Route path="home/functions" element={<Functions />} />
        <Route path="home/syllabus" element={<Syllabus />} />
        <Route path="home/aunt" element={<Aunt />} />
        <Route path="home/loan" element={<Loan />} />
        <Route path="home/menusort" element={<MenuSort />} />
        <Route path="search/index" element={<Search />} />
        <Route path="dataio" element={<DataIO />} />
        <Route path="help" element={<Help />} />
        <Route path="newcomerGuide/newcomerGuide" element={<NewcomerGuide />} />
        <Route path="characteristic/index" element={<Characteristic />} />
        <Route path="newFeatures/index" element={<NewFeatures />} />
        <Route path="*" element={<Navigate to={startPage} replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const theme = useSettingsStore(s => s.theme);
  const load = useSettingsStore(s => s.load);
  const themeMeta = THEMES.find(t => t.key === theme) || THEMES[0];

  useEffect(() => {
    (async () => { await seedIfEmpty(); await load(); setReady(true); })();
  }, [load]);

  if (!ready) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  return (
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: themeMeta.accent, borderRadius: 6 } }}>
      <AntApp>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  );
}
