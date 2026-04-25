// 应用路由根 - 锁屏守卫化 + 懒加载路由
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useReminder } from '@/hooks/useReminder';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useSettingsStore } from '@/stores/settingsStore';
import { seedIfEmpty } from '@/db/seed';
import { useThemeVariants } from '@/hooks/useVariants';
import { ROUTES } from '@/config/routes';
import { resolveAutoTheme } from '@/utils/themeAuto';

const Layout = lazy(() => import('@/components/Layout'));
const HomePage = lazy(() => import('@/pages/home'));
const MyDay = lazy(() => import('@/pages/today/MyDay'));
const MyWeek = lazy(() => import('@/pages/today/MyWeek'));
const MyMonth = lazy(() => import('@/pages/today/MyMonth'));
const MyYear = lazy(() => import('@/pages/today/MyYear'));
const All = lazy(() => import('@/pages/matter/All'));
const Schedule = lazy(() => import('@/pages/matter/Schedule'));
const CheckList = lazy(() => import('@/pages/matter/CheckList'));
const Importance = lazy(() => import('@/pages/matter/Importance'));
const Repeat = lazy(() => import('@/pages/matter/Repeat'));
const Memo = lazy(() => import('@/pages/memo'));
const Diary = lazy(() => import('@/pages/diary'));
const Focus = lazy(() => import('@/pages/focus'));
const ThemeSkin = lazy(() => import('@/pages/themeskin'));
const System = lazy(() => import('@/pages/systemsetting'));
const DataIO = lazy(() => import('@/pages/dataio'));
const Feedback = lazy(() => import('@/pages/feedback'));
const User = lazy(() => import('@/pages/user'));
const Search = lazy(() => import('@/pages/search'));
const Help = lazy(() => import('@/pages/help'));
const Desktop = lazy(() => import('@/pages/desktop'));
const AppLock = lazy(() => import('@/pages/applicationlock'));
const Unlock = lazy(() => import('@/pages/applicationlock/Unlock'));
const Classify = lazy(() => import('@/pages/classify'));
const Trash = lazy(() => import('@/pages/trash'));
const NewcomerGuide = lazy(() => import('@/pages/help/Guide'));
const Characteristic = lazy(() => import('@/pages/help/Characteristic'));
const NewFeatures = lazy(() => import('@/pages/help/NewFeatures'));
const Functions = lazy(() => import('@/pages/functions'));
const Syllabus = lazy(() => import('@/pages/syllabus'));
const Aunt = lazy(() => import('@/pages/aunt'));
const Loan = lazy(() => import('@/pages/loan'));
const MenuSort = lazy(() => import('@/pages/menusort'));
const Habit = lazy(() => import('@/pages/habit'));
const Goal = lazy(() => import('@/pages/goal'));
const Growth = lazy(() => import('@/pages/growth'));
const GrowthReport = lazy(() => import('@/pages/growth/Report'));
const Review = lazy(() => import('@/pages/review'));
const Agent = lazy(() => import('@/pages/agent'));

function PageFallback() {
  return (
    <div style={{
      minHeight: '50vh',
      display: 'grid',
      placeItems: 'center',
      color: '#475569'
    }}>
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载页面资源...</div>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/unlock" element={<Unlock />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to={startPage} replace />} />
          <Route path="home" element={<Navigate to={startPage} replace />} />
          <Route path="home/index" element={<HomePage />} />
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
          <Route path="home/habit" element={<Habit />} />
          <Route path="home/goal" element={<Goal />} />
          <Route path="home/growth" element={<Growth />} />
          <Route path="home/growth/report" element={<GrowthReport />} />
          <Route path="home/review" element={<Review />} />
          <Route path="home/agent" element={<Agent />} />
          <Route path="search/index" element={<Search />} />
          <Route path="dataio" element={<DataIO />} />
          <Route path="help" element={<Help />} />
          <Route path="newcomerGuide/newcomerGuide" element={<NewcomerGuide />} />
          <Route path="characteristic/index" element={<Characteristic />} />
          <Route path="newFeatures/index" element={<NewFeatures />} />
          <Route path="*" element={<Navigate to={startPage} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const theme = useSettingsStore(s => s.theme);
  const themeMode = useSettingsStore(s => s.themeMode);
  const autoThemeDay = useSettingsStore(s => s.autoThemeDay);
  const autoThemeNight = useSettingsStore(s => s.autoThemeNight);
  const autoThemeDayStart = useSettingsStore(s => s.autoThemeDayStart);
  const autoThemeNightStart = useSettingsStore(s => s.autoThemeNightStart);
  const customFont = useSettingsStore(s => s.customFont);
  const load = useSettingsStore(s => s.load);
  const setTheme = useSettingsStore(s => s.setTheme);
  const { getAntdTheme } = useThemeVariants();

  useEffect(() => {
    (async () => { await seedIfEmpty(); await load(); setReady(true); })();
  }, [load]);

  useEffect(() => {
    if (!ready || themeMode !== 'auto') return;
    let stopped = false;
    const syncTheme = async () => {
      const next = resolveAutoTheme(Date.now(), autoThemeDay, autoThemeNight, autoThemeDayStart, autoThemeNightStart);
      if (!stopped && theme !== next) await setTheme(next);
    };
    void syncTheme();
    const timer = window.setInterval(() => { void syncTheme(); }, 60_000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [autoThemeDay, autoThemeDayStart, autoThemeNight, autoThemeNightStart, ready, setTheme, theme, themeMode]);

  useEffect(() => {
    document.body.style.fontFamily = customFont || '';
  }, [customFont]);

  if (!ready) return <div style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;

  return (
    <ConfigProvider
      locale={zhCN}
      theme={getAntdTheme()}
    >
      <AntApp>
        <HashRouter>
          <AppShell />
        </HashRouter>
      </AntApp>
    </ConfigProvider>
  );
}
