/**
 * Bibliothèque de calculs pour les KPI
 */

export interface VariationResult {
  diff: number;
  percent: number;
  direction: "up" | "down" | "stable";
}

/**
 * Calcule la variation entre deux valeurs
 */
export const calculateVariation = (
  current: number,
  previous: number | null | undefined
): VariationResult => {
  if (previous === null || previous === undefined || previous === 0) {
    return {
      diff: current,
      percent: 0,
      direction: "stable",
    };
  }

  const diff = current - previous;
  const percent = (diff / Math.abs(previous)) * 100;
  const direction = diff > 0 ? "up" : diff < 0 ? "down" : "stable";

  return { diff, percent, direction };
};

/**
 * Formate une valeur KPI selon son unité
 */
export const formatKPIValue = (value: number, type: string): string => {
  if (value === null || value === undefined) return "N/A";

  switch (type) {
    case "currency":
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case "percentage":
      return `${value.toFixed(1)}%`;

    case "decimal":
      return value.toFixed(2);

    case "integer":
    case "number":
    default:
      return new Intl.NumberFormat("fr-FR").format(Math.round(value));
  }
};

/**
 * Calcule l'écart de trésorerie (CA Encaissé - Dépenses)
 */
export const calculateTresorerieEcart = (
  caEncaisse: number,
  depenses: number
): number => {
  return caEncaisse - depenses;
};

/**
 * Calcule le décalage entre CA Facturé et CA Encaissé
 */
export const calculateDecalage = (
  caFacture: number,
  caEncaisse: number
): { montant: number; pourcentage: number } => {
  const montant = caFacture - caEncaisse;
  const pourcentage =
    caFacture !== 0 ? (montant / caFacture) * 100 : 0;

  return { montant, pourcentage };
};

/**
 * Calcule le cumul progressif sur une période
 */
export const calculateCumul = (
  values: Array<{ date: string; valeur: number }>
): Array<{ date: string; cumul: number }> => {
  let cumul = 0;
  return values.map((item) => {
    cumul += item.valeur;
    return { date: item.date, cumul };
  });
};

/**
 * Aligne les données pour comparaison N vs N-1
 */
export const getComparisonData = (
  currentYear: Array<{ date: string; valeur: number }>,
  previousYear: Array<{ date: string; valeur: number }>
): Array<{
  date: string;
  currentValue: number;
  previousValue: number | null;
}> => {
  return currentYear.map((current, index) => ({
    date: current.date,
    currentValue: current.valeur,
    previousValue: previousYear[index]?.valeur || null,
  }));
};

/**
 * Calcule le pourcentage d'atteinte d'un objectif
 */
export const calculateObjectifProgress = (
  valeurReelle: number,
  valeurObjectif: number
): number => {
  if (valeurObjectif === 0) return 0;
  return (valeurReelle / valeurObjectif) * 100;
};

/**
 * Génère les données pour un sparkline (mini-graphique)
 */
export const generateSparklineData = (
  values: Array<{ date: string; valeur: number }>
): number[] => {
  return values.map((v) => v.valeur);
};

/**
 * Formate une période pour l'affichage
 */
export const formatPeriod = (
  dateDebut: Date,
  dateFin?: Date | null
): string => {
  const debut = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(dateDebut);

  if (!dateFin) return debut;

  const fin = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(dateFin);

  return `${debut} - ${fin}`;
};

/**
 * Calcule la moyenne mobile sur N périodes
 */
export const calculateMovingAverage = (
  values: number[],
  periods: number = 3
): number[] => {
  const result: number[] = [];

  for (let i = 0; i < values.length; i++) {
    if (i < periods - 1) {
      result.push(values[i]);
    } else {
      const sum = values.slice(i - periods + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / periods);
    }
  }

  return result;
};
