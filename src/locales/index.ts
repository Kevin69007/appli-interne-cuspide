import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import French translations
import commonFr from './fr/common.json';
import authFr from './fr/auth.json';
import tasksFr from './fr/tasks.json';
import projectsFr from './fr/projects.json';
import meetingsFr from './fr/meetings.json';
import indicatorsFr from './fr/indicators.json';
import communicationFr from './fr/communication.json';
import stockFr from './fr/stock.json';
import surveysFr from './fr/surveys.json';
import rhFr from './fr/rh.json';
import planningFr from './fr/planning.json';
import directionFr from './fr/direction.json';
import notfoundFr from './fr/notfound.json';

// Import English translations
import commonEn from './en/common.json';
import authEn from './en/auth.json';
import tasksEn from './en/tasks.json';
import projectsEn from './en/projects.json';
import meetingsEn from './en/meetings.json';
import indicatorsEn from './en/indicators.json';
import communicationEn from './en/communication.json';
import stockEn from './en/stock.json';
import surveysEn from './en/surveys.json';
import rhEn from './en/rh.json';
import planningEn from './en/planning.json';
import directionEn from './en/direction.json';
import notfoundEn from './en/notfound.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: commonFr,
        auth: authFr,
        tasks: tasksFr,
        projects: projectsFr,
        meetings: meetingsFr,
        indicators: indicatorsFr,
        communication: communicationFr,
        stock: stockFr,
        surveys: surveysFr,
        rh: rhFr,
        planning: planningFr,
        direction: directionFr,
        notfound: notfoundFr,
      },
      en: {
        common: commonEn,
        auth: authEn,
        tasks: tasksEn,
        projects: projectsEn,
        meetings: meetingsEn,
        indicators: indicatorsEn,
        communication: communicationEn,
        stock: stockEn,
        surveys: surveysEn,
        rh: rhEn,
        planning: planningEn,
        direction: directionEn,
        notfound: notfoundEn,
      },
    },
    fallbackLng: 'fr',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
