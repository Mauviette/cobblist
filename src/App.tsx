import { Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { useI18n } from './i18n/I18nProvider';
import { HomePage } from './pages/HomePage';
import { ProjectPage } from './pages/ProjectPage';
import { SharedImportPage } from './pages/SharedImportPage';

function App() {
  const { t } = useI18n();

  return (
    <div className="bg-texture-body flex min-h-screen flex-col bg-stone-100 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/project/:id" element={<ProjectPage />} />
          <Route path="/s" element={<SharedImportPage />} />
        </Routes>
      </main>
      <footer className="print:hidden mx-auto w-full max-w-5xl px-4 py-4 text-center text-xs text-stone-500 dark:text-stone-400">
        {t('app.footer')}
      </footer>
    </div>
  );
}

export default App;
