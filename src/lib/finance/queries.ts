import * as engine from "./engine";
import type {
  Category,
  Currency,
  ExportColumnKey,
  Filters,
  SortField,
  SortOrder,
  Status,
  UploadRow,
} from "./types";

/** Thin wrappers so page code stays close to the original query shape. */

export const getSettings = async () => engine.getSettings();

export const updateSettings = async (input: {
  data: { currency?: Currency; notifyFailed?: boolean; notifyPending?: boolean };
}) => engine.updateSettings(input.data);

export const getDashboard = async (input?: { data?: Filters }) =>
  engine.getDashboard(input?.data ?? {});

export const listTransactions = async (input: {
  data: {
    page: number;
    limit: number;
    sortBy: SortField;
    sortOrder: SortOrder;
    filters: Filters;
  };
}) => engine.listTransactions(input.data);

export const exportTransactions = async (input: {
  data: {
    filters: Filters;
    sortBy: SortField;
    sortOrder: SortOrder;
    columns: ExportColumnKey[] | string[];
    filename?: string;
  };
}) => engine.exportTransactions(input.data);

export const addTransaction = async (input: {
  data: {
    date: string;
    amount: number;
    category: Category;
    status: Status;
    partyName: string;
    note?: string;
  };
}) => engine.addTransaction(input.data);

export const importTransactions = async (input: {
  data: { filename: string; rows: UploadRow[] };
}) => engine.importTransactions(input.data);

export const listAlerts = async () => engine.listAlerts();

export const markAlertRead = async (input: { data: { id: number; read?: boolean } }) =>
  engine.markAlertRead(input.data.id, input.data.read ?? true);

export const markAllAlertsRead = async () => engine.markAllAlertsRead();

export const listUploads = async () => engine.listUploads();

export const resetDemoData = async () => engine.resetDemoData();

export const wipeUserData = async () => engine.wipeUserData();


export const getBudgetOverview = async () => engine.getBudgetOverview();
export const listBudgets = async () => engine.listBudgets();
export const updateBudgetLimit = async (input: { data: { id: string; monthlyLimit: number } }) =>
  engine.updateBudgetLimit(input.data.id, input.data.monthlyLimit);
export const getAnomalies = async () => engine.getAnomalies();
export const getAnomalyMap = async () => engine.getAnomalyMap();
