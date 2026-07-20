import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Dumbbell,
  Languages,
  BookOpen,
  CheckSquare,
  Plus,
  Trash2,
  ChevronLeft,
  Calendar,
  Sparkles,
  Check,
  X,
  Search,
  Coffee,
  Bookmark,
  Play,
  Archive,
  CheckCircle,
  CalendarRange,
  Inbox,
  Move,
  Menu,
  Briefcase,
  Heart,
  Smile,
  Code,
  GraduationCap,
  Music,
  Settings
} from "lucide-react";
import { Word, LearningPlan, DayPlan, LearningTask, TaskType } from "../types";

interface TaskTypeConfig {
  id: string;
  label: string;
  icon: string;
  color: string;
  sortOrder?: number;
}

const DEFAULT_TASK_TYPES: TaskTypeConfig[] = [
  { id: "shortTask", label: "备忘任务", icon: "CheckSquare", color: "teal" },
  { id: "reading", label: "日常阅读", icon: "BookOpen", color: "amber" },
  { id: "sports", label: "运动训练", icon: "Dumbbell", color: "rose" },
  { id: "language", label: "语言学习", icon: "Languages", color: "violet" },
];

const PRESET_ICONS = [
  { name: "CheckSquare", component: CheckSquare },
  { name: "BookOpen", component: BookOpen },
  { name: "Dumbbell", component: Dumbbell },
  { name: "Languages", component: Languages },
  { name: "Briefcase", component: Briefcase },
  { name: "Heart", component: Heart },
  { name: "Smile", component: Smile },
  { name: "Code", component: Code },
  { name: "GraduationCap", component: GraduationCap },
  { name: "Music", component: Music },
  { name: "Coffee", component: Coffee },
  { name: "Bookmark", component: Bookmark },
  { name: "Sparkles", component: Sparkles }
];

const PRESET_COLORS = [
  { name: "teal", borderClass: "border-l-teal-500", textClass: "text-teal-500", bgClass: "bg-teal-50" },
  { name: "amber", borderClass: "border-l-amber-500", textClass: "text-amber-500", bgClass: "bg-amber-50" },
  { name: "rose", borderClass: "border-l-rose-500", textClass: "text-rose-500", bgClass: "bg-rose-50" },
  { name: "violet", borderClass: "border-l-violet-500", textClass: "text-violet-500", bgClass: "bg-violet-50" },
  { name: "emerald", borderClass: "border-l-emerald-500", textClass: "text-emerald-500", bgClass: "bg-emerald-50" },
  { name: "blue", borderClass: "border-l-blue-500", textClass: "text-blue-500", bgClass: "bg-blue-50" },
  { name: "indigo", borderClass: "border-l-indigo-500", textClass: "text-indigo-500", bgClass: "bg-indigo-50" },
  { name: "pink", borderClass: "border-l-pink-500", textClass: "text-pink-500", bgClass: "bg-pink-50" },
  { name: "orange", borderClass: "border-l-orange-500", textClass: "text-orange-500", bgClass: "bg-orange-50" },
  { name: "sky", borderClass: "border-l-sky-500", textClass: "text-sky-500", bgClass: "bg-sky-50" }
];

const configT: Record<string, Record<string, string>> = {
  zh: {
    manageTypes: "管理任务类型",
    addType: "添加新任务类型",
    typeName: "任务类型名称",
    typePlaceholder: "例如：自我提升、家务琐事",
    selectIcon: "选择图标",
    selectColor: "选择主题颜色",
    confirmAdd: "确认添加",
    resetDefault: "恢复默认类型",
    delete: "删除",
    cantDeleteLast: "至少需要保留一个任务类型",
    typesDesc: "您可以自定义每日日程计划中可供选择的任务类型、对应图标和颜色。",
    save: "保存"
  },
  en: {
    manageTypes: "Manage Task Types",
    addType: "Add Task Type",
    typeName: "Type Label",
    typePlaceholder: "e.g., Self-Improvement, Chores",
    selectIcon: "Select Icon",
    selectColor: "Select Color",
    confirmAdd: "Add Type",
    resetDefault: "Reset to Default",
    delete: "Delete",
    cantDeleteLast: "At least one task type is required",
    typesDesc: "Customize the types, icons, and colors of tasks you can add to your schedule.",
    save: "Save"
  },
  ja: {
    manageTypes: "タスクタイプ管理",
    addType: "新しいタイプを追加",
    typeName: "タイプ名",
    typePlaceholder: "例：自己啓発、家事",
    selectIcon: "アイコンを選択",
    selectColor: "テーマカラーを選択",
    confirmAdd: "追加する",
    resetDefault: "デフォルトに戻す",
    delete: "削除",
    cantDeleteLast: "少なくとも1つのタスクタイプが必要です",
    typesDesc: "スケジュールに追加できるタスクの種類、アイコン、色をカスタマイズできます。",
    save: "保存"
  },
  es: {
    manageTypes: "Gestionar Tipos de Tarea",
    addType: "Añadir Tipo de Tarea",
    typeName: "Etiqueta del Tipo",
    typePlaceholder: "p. ej., Automejora, Quehaceres",
    selectIcon: "Seleccionar Icono",
    selectColor: "Seleccionar Color",
    confirmAdd: "Añadir Tipo",
    resetDefault: "Restablecer por Defecto",
    delete: "Eliminar",
    cantDeleteLast: "Se requiere al menos un tipo de tarea",
    typesDesc: "Personaliza los tipos, iconos y colores de las tareas que puedes añadir a tu agenda.",
    save: "Guardar"
  },
  fr: {
    manageTypes: "Gérer les Types de Tâche",
    addType: "Ajouter un Type",
    typeName: "Étiquette du Type",
    typePlaceholder: "p. ex., Auto-amélioration, Corvées",
    selectIcon: "Choisir l'Icône",
    selectColor: "Choisir la Couleur",
    confirmAdd: "Ajouter",
    resetDefault: "Réinitialiser",
    delete: "Supprimer",
    cantDeleteLast: "Au moins un type de tâche est requis",
    typesDesc: "Personnalisez les types, icônes et couleurs des tâches de votre agenda.",
    save: "Enregistrer"
  },
  pt: {
    manageTypes: "Gerir Tipos de Tarefa",
    addType: "Adicionar Tipo de Tarefa",
    typeName: "Etiqueta do Tipo",
    typePlaceholder: "p. ex., Autoaperfeiçoamento, Tarefas",
    selectIcon: "Selecionar Ícone",
    selectColor: "Selecionar Cor",
    confirmAdd: "Adicionar Tipo",
    resetDefault: "Restaurar Padrão",
    delete: "Eliminar",
    cantDeleteLast: "É necessário pelo menos um tipo de tarefa",
    typesDesc: "Personalize os tipos, ícones e cores das tarefas que pode adicionar à sua agenda.",
    save: "Guardar"
  }
};

interface LearningPlansProps {
  words: Word[];
  plans: LearningPlan[];
  taskTypes: TaskTypeConfig[];
  onCreatePlan: (plan: LearningPlan) => Promise<LearningPlan | null>;
  onUpdatePlan: (planId: string, updates: Partial<LearningPlan>) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  onSaveTask: (planId: string, task: LearningTask, dayOfWeek: number, sortOrder?: number) => Promise<void>;
  onDeleteTask: (planId: string, taskId: string) => Promise<void>;
  onUpdateDayMeta: (planId: string, dayOfWeek: number, meta: { isRestDay?: boolean; completed?: boolean }) => Promise<void>;
  onSaveTaskTypes: (types: TaskTypeConfig[]) => Promise<void>;
  onStartCustomReview: (wordIds: string[], taskId?: string, dayOfWeek?: number, planId?: string) => void;
  onBack: () => void;
  selectedLanguage?: string;
  useTargetUi?: boolean;
}

const DAYS_NAME = [
  { value: 1, zh: "周一", en: "Monday", ja: "月曜日", es: "Lunes", fr: "Lundi", pt: "Segunda" },
  { value: 2, zh: "周二", en: "Tuesday", ja: "火曜日", es: "Martes", fr: "Mardi", pt: "Terça" },
  { value: 3, zh: "周三", en: "Wednesday", ja: "水曜日", es: "Miércoles", fr: "Mercredi", pt: "Quarta" },
  { value: 4, zh: "周四", en: "Thursday", ja: "木曜日", es: "Jueves", fr: "Jeudi", pt: "Quinta" },
  { value: 5, zh: "周五", en: "Friday", ja: "金曜日", es: "Viernes", fr: "Vendredi", pt: "Sexta" },
  { value: 6, zh: "周六", en: "Saturday", ja: "土曜日", es: "Sábado", fr: "Samedi", pt: "Sábado" },
  { value: 7, zh: "周日", en: "Sunday", ja: "日曜日", es: "Domingo", fr: "Dimanche", pt: "Domingo" }
];

// Localized strings for Chinese, English, Japanese, Spanish, French, Portuguese
const localT: Record<string, Record<string, string>> = {
  zh: {
    back: "返回主页",
    plansTitle: "极简周日程计划",
    plansSubtitle: "启发自 WeekTodo 的看板式周记事簿，双向联动词库复习",
    createPlan: "新建周计划",
    allPlans: "所有周计划",
    inbox: "备忘灵感池",
    inboxDesc: "收集生词或临时想法",
    addPlanTitle: "新建计划周期",
    titleLabel: "计划名称",
    titlePlaceholder: "例如：7月第四周学习与体能突破",
    startDateLabel: "起始日期 (自动规划7天)",
    restDaysLabel: "标记休息放松日",
    cancel: "取消",
    confirm: "保存计划",
    addTaskPlaceholder: "快速添加任务...",
    add: "添加",
    deletePlanConfirm: "确定要删除这个计划吗？此操作不可逆。",
    deleteTaskConfirm: "确定要删除该项任务吗？",
    editTask: "编辑任务",
    saveTask: "保存任务",
    taskTitleLabel: "任务名称",
    taskDescLabel: "任务描述 (可选)",
    linkVocabLabel: "关联词库单词",
    searchVocabPlaceholder: "搜索词库单词或释义...",
    linkedWordsCount: "已关联 {count} 个单词",
    oneClickReview: "一键复习",
    restDay: "休息放松日",
    today: "今日",
    moveTo: "一键转移至",
    workDay: "工作日",
    completed: "已完成",
    progress: "本周打卡进度",
    collapse: "收起左侧计划面板",
    expand: "展开左侧计划面板",
    noPlanSelected: "请在左侧选择或创建一个周计划开始规划！",
    sports: "运动训练",
    language: "语言学习",
    reading: "日常阅读",
    shortTask: "备忘任务",
    archived: "已归档",
    active: "进行中",
    archive: "归档",
    unarchive: "激活",
    delete: "删除",
  },
  en: {
    back: "Back",
    plansTitle: "Weekly Planner",
    plansSubtitle: "WeekTodo-inspired minimalist weekly schedule with custom SRS vocabulary linking",
    createPlan: "Create Week Plan",
    allPlans: "All Plans",
    inbox: "Inbox & Ideas",
    inboxDesc: "Raw thoughts & word memos",
    addPlanTitle: "Create New Plan",
    titleLabel: "Plan Title",
    titlePlaceholder: "e.g., July Week 4 Breakout",
    startDateLabel: "Start Date (7 Days Plan)",
    restDaysLabel: "Select Rest Days",
    cancel: "Cancel",
    confirm: "Save Plan",
    addTaskPlaceholder: "Add a task...",
    add: "Add",
    deletePlanConfirm: "Are you sure you want to delete this plan? This cannot be undone.",
    deleteTaskConfirm: "Are you sure you want to delete this task?",
    editTask: "Advanced",
    saveTask: "Save Task",
    taskTitleLabel: "Task Title",
    taskDescLabel: "Task Description (Optional)",
    linkVocabLabel: "Link Vocabulary",
    searchVocabPlaceholder: "Search words or definitions...",
    linkedWordsCount: "Selected {count} words",
    oneClickReview: "Review Words",
    restDay: "Rest Day",
    today: "Today",
    moveTo: "Move task to",
    workDay: "Workday",
    completed: "Done",
    progress: "Weekly Progress",
    collapse: "Hide plans list",
    expand: "Show plans list",
    noPlanSelected: "Please select or create a plan to get started!",
    sports: "Sports & Fitness",
    language: "Language Study",
    reading: "Reading",
    shortTask: "Quick Task",
    archived: "Archived",
    active: "Active",
    archive: "Archive",
    unarchive: "Activate",
    delete: "Delete",
  },
  ja: {
    back: "戻る",
    plansTitle: "週間プランナー",
    plansSubtitle: "WeekTodo風のミニマリストかんばん予定表（単語復習連動）",
    createPlan: "プラン新規作成",
    allPlans: "すべてのプラン",
    inbox: "インボックス",
    inboxDesc: "未分類のアイデアや単語メモ",
    addPlanTitle: "新規プラン作成",
    titleLabel: "プラン名",
    titlePlaceholder: "例：7月第4週語学＆フィットネス計画",
    startDateLabel: "開始日 (自動7日間スケジュール)",
    restDaysLabel: "休日を選択",
    cancel: "キャンセル",
    confirm: "プラン保存",
    addTaskPlaceholder: "タスクを追加...",
    add: "追加",
    deletePlanConfirm: "このプランを削除してもよろしいですか？",
    deleteTaskConfirm: "このタスクを削除してもよろしいですか？",
    editTask: "詳細編集",
    saveTask: "タスク保存",
    taskTitleLabel: "タスク名",
    taskDescLabel: "説明 (任意)",
    linkVocabLabel: "語彙をリンク",
    searchVocabPlaceholder: "単語や意味を検索...",
    linkedWordsCount: "選択済み: {count} 語",
    oneClickReview: "復習開始",
    restDay: "休日",
    today: "今日",
    moveTo: "タスクを移動...",
    workDay: "平日",
    completed: "完了",
    progress: "進捗状況",
    collapse: "リストを隠す",
    expand: "リストを表示",
    noPlanSelected: "プランを選択するか、新規作成して開始してください！",
    sports: "スポーツ＆フィットネス",
    language: "語学学習",
    reading: "読書",
    shortTask: "簡易タスク",
    archived: "アーカイブ済",
    active: "進行中",
    archive: "アーカイブ",
    unarchive: "アクティブ化",
    delete: "削除",
  },
  es: {
    back: "Volver",
    plansTitle: "Planificador Semanal",
    plansSubtitle: "Agenda semanal minimalista inspirada en WeekTodo con repaso de vocabulario integrado",
    createPlan: "Crear Plan Semanal",
    allPlans: "Todos los Planes",
    inbox: "Bandeja de Entrada",
    inboxDesc: "Ideas y notas rápidas",
    addPlanTitle: "Crear Nuevo Plan",
    titleLabel: "Título del Plan",
    titlePlaceholder: "p. ej., Julio Semana 4",
    startDateLabel: "Fecha de Inicio (7 Días)",
    restDaysLabel: "Seleccionar Días de Descanso",
    cancel: "Cancelar",
    confirm: "Guardar Plan",
    addTaskPlaceholder: "Añadir tarea...",
    add: "Añadir",
    deletePlanConfirm: "¿Seguro que quieres eliminar este plan? No se puede deshacer.",
    deleteTaskConfirm: "¿Seguro que quieres eliminar esta tarea?",
    editTask: "Avanzado",
    saveTask: "Guardar Tarea",
    taskTitleLabel: "Título de la Tarea",
    taskDescLabel: "Descripción (Opcional)",
    linkVocabLabel: "Vincular Vocabulario",
    searchVocabPlaceholder: "Buscar palabras o definiciones...",
    linkedWordsCount: "{count} palabras seleccionadas",
    oneClickReview: "Repasar Palabras",
    restDay: "Día de Descanso",
    today: "Hoy",
    moveTo: "Mover tarea a",
    workDay: "Día laboral",
    completed: "Hecho",
    progress: "Progreso Semanal",
    collapse: "Ocultar lista",
    expand: "Mostrar lista",
    noPlanSelected: "¡Selecciona o crea un plan para empezar!",
    sports: "Deportes y Fitness",
    language: "Estudio de Idiomas",
    reading: "Lectura",
    shortTask: "Tarea Rápida",
    archived: "Archivado",
    active: "Activo",
    archive: "Archivar",
    unarchive: "Activar",
    delete: "Eliminar",
  },
  fr: {
    back: "Retour",
    plansTitle: "Planificateur Hebdomadaire",
    plansSubtitle: "Agenda hebdomadaire minimaliste inspiré de WeekTodo avec révision de vocabulaire intégrée",
    createPlan: "Créer un Plan",
    allPlans: "Tous les Plans",
    inbox: "Boîte de Réception",
    inboxDesc: "Idées et notes rapides",
    addPlanTitle: "Créer un Nouveau Plan",
    titleLabel: "Titre du Plan",
    titlePlaceholder: "p. ex., Juillet Semaine 4",
    startDateLabel: "Date de Début (7 Jours)",
    restDaysLabel: "Sélectionner les Jours de Repos",
    cancel: "Annuler",
    confirm: "Enregistrer le Plan",
    addTaskPlaceholder: "Ajouter une tâche...",
    add: "Ajouter",
    deletePlanConfirm: "Êtes-vous sûr de vouloir supprimer ce plan ? Irréversible.",
    deleteTaskConfirm: "Êtes-vous sûr de vouloir supprimer cette tâche ?",
    editTask: "Avancé",
    saveTask: "Enregistrer la Tâche",
    taskTitleLabel: "Titre de la Tâche",
    taskDescLabel: "Description (Optionnel)",
    linkVocabLabel: "Lier le Vocabulaire",
    searchVocabPlaceholder: "Rechercher des mots ou définitions...",
    linkedWordsCount: "{count} mots sélectionnés",
    oneClickReview: "Réviser les Mots",
    restDay: "Jour de Repos",
    today: "Aujourd'hui",
    moveTo: "Déplacer vers",
    workDay: "Jour ouvré",
    completed: "Terminé",
    progress: "Progrès Hebdomadaire",
    collapse: "Masquer la liste",
    expand: "Afficher la liste",
    noPlanSelected: "Veuillez sélectionner ou créer un plan pour commencer !",
    sports: "Sport et Fitness",
    language: "Étude des Langues",
    reading: "Lecture",
    shortTask: "Tâche Rapide",
    archived: "Archivé",
    active: "Actif",
    archive: "Archiver",
    unarchive: "Activer",
    delete: "Supprimer",
  },
  pt: {
    back: "Voltar",
    plansTitle: "Planeador Semanal",
    plansSubtitle: "Agenda semanal minimalista inspirada no WeekTodo com revisão de vocabulário integrada",
    createPlan: "Criar Plano Semanal",
    allPlans: "Todos os Planos",
    inbox: "Caixa de Entrada",
    inboxDesc: "Ideias e notas rápidas",
    addPlanTitle: "Criar Novo Plano",
    titleLabel: "Título do Plano",
    titlePlaceholder: "p. ex., Julho Semana 4",
    startDateLabel: "Data de Início (7 Dias)",
    restDaysLabel: "Selecionar Dias de Descanso",
    cancel: "Cancelar",
    confirm: "Guardar Plano",
    addTaskPlaceholder: "Adicionar tarefa...",
    add: "Adicionar",
    deletePlanConfirm: "Tem a certeza que pretende eliminar este plano? Irreversível.",
    deleteTaskConfirm: "Tem a certeza que pretende eliminar esta tarefa?",
    editTask: "Avançado",
    saveTask: "Guardar Tarefa",
    taskTitleLabel: "Título da Tarefa",
    taskDescLabel: "Descrição (Opcional)",
    linkVocabLabel: "Vincular Vocabulário",
    searchVocabPlaceholder: "Pesquisar palavras ou definições...",
    linkedWordsCount: "{count} palavras selecionadas",
    oneClickReview: "Revisar Palavras",
    restDay: "Dia de Descanso",
    today: "Hoje",
    moveTo: "Mover tarefa para",
    workDay: "Dia útil",
    completed: "Concluído",
    progress: "Progresso Semanal",
    collapse: "Ocultar lista",
    expand: "Mostrar lista",
    noPlanSelected: "Por favor, selecione ou crie um plano para começar!",
    sports: "Desporto e Fitness",
    language: "Estudo de Línguas",
    reading: "Leitura",
    shortTask: "Tarefa Rápida",
    archived: "Arquivado",
    active: "Ativo",
    archive: "Arquivar",
    unarchive: "Ativar",
    delete: "Eliminar",
  }
};

export default function LearningPlans({
  words,
  plans,
  taskTypes: propTaskTypes,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan,
  onSaveTask,
  onDeleteTask,
  onUpdateDayMeta,
  onSaveTaskTypes,
  onStartCustomReview,
  onBack,
  selectedLanguage = "zh",
  useTargetUi = false
}: LearningPlansProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // 任务类型: 本地 state 用于乐观更新 + 立即 UI 反馈
  // propTaskTypes 是 App.tsx fetch 的数据源,回流时同步到本地
  const [taskTypes, setTaskTypes] = useState<TaskTypeConfig[]>(propTaskTypes);
  // 操作进行中的 loading 状态(用于按钮反馈)
  const [isSavingType, setIsSavingType] = useState(false);
  // 轻量 toast 提示(操作成功/失败反馈)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    setTaskTypes(propTaskTypes);
  }, [propTaskTypes]);

  // 默认选中第一个 active 计划(只在 plans 变化时初始化一次)
  useEffect(() => {
    if (!selectedPlanId && plans.length > 0) {
      const active = plans.find(p => p.status === "active") || plans[0];
      setSelectedPlanId(active.id);
    }
    // 若当前选中的计划被删除了,切到第一个
    if (selectedPlanId && !plans.some(p => p.id === selectedPlanId)) {
      setSelectedPlanId(plans.length > 0 ? plans[0].id : null);
    }
  }, [plans, selectedPlanId]);

  // Collapsible sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals / Editors state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanStartDate, setNewPlanStartDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [newPlanRestDays, setNewPlanRestDays] = useState<number[]>([6, 7]); // default Sat & Sun

  // Advanced Task creation/editing inline modal state
  const [editingDayNum, setEditingDayNum] = useState<number | null>(null);
  const [editingTaskType, setEditingTaskType] = useState<TaskType | null>(null);
  const [editingTask, setEditingTask] = useState<LearningTask | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [wordSearchQuery, setWordSearchQuery] = useState("");

  // 任务类型用 props 传入,本地只保留管理弹窗的状态
  const [showTypeConfigModal, setShowTypeConfigModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("CheckSquare");
  const [newTypeColor, setNewTypeColor] = useState("teal");

  // Quick Inline Add State
  const [activeInlineAddDayNum, setActiveInlineAddDayNum] = useState<number | null>(null);
  const [inlineTaskTitle, setInlineTaskTitle] = useState("");
  const [inlineTaskType, setInlineTaskType] = useState<TaskType>(() => taskTypes[0]?.id || "shortTask");

  // Move task dropdown state
  const [activeMoveTask, setActiveMoveTask] = useState<{ dayNum: number; taskId: string } | null>(null);

  // Language detection
  const getLangCode = (): "zh" | "en" | "ja" | "es" | "fr" | "pt" => {
    if (!useTargetUi) return "zh";
    const lang = selectedLanguage === "All" ? "en" : selectedLanguage;
    if (lang === "Japanese") return "ja";
    if (lang === "Spanish") return "es";
    if (lang === "French") return "fr";
    if (lang === "Portuguese") return "pt";
    return "en";
  };
  const lang = getLangCode();

  const currentPlan = plans.find(p => p.id === selectedPlanId) || null;

  // 保存任务类型配置(乐观更新版)
  // 先立即更新本地 state(用户立刻看到变化),再异步调 API
  // API 失败时回滚到之前的状态并 toast 提示
  const saveTaskTypes = async (newTypes: TaskTypeConfig[], successMsg?: string): Promise<boolean> => {
    const prevTypes = taskTypes;
    // 乐观更新: 立即让 UI 反映新状态
    setTaskTypes(newTypes);
    setIsSavingType(true);
    try {
      await onSaveTaskTypes(newTypes);
      setIsSavingType(false);
      if (successMsg) showToast(successMsg, "success");
      return true;
    } catch (err) {
      console.error("Failed to save task types:", err);
      // 回滚
      setTaskTypes(prevTypes);
      setIsSavingType(false);
      showToast("保存失败,已回滚", "error");
      return false;
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    const start = new Date(newPlanStartDate);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    const endDateStr = end.toISOString().split("T")[0];

    const newPlan: LearningPlan = {
      id: "plan-" + Date.now(),
      title: newPlanTitle,
      startDate: newPlanStartDate,
      endDate: endDateStr,
      status: "active",
      days: [
        // Day 0: Inbox
        {
          dayOfWeek: 0,
          isRestDay: false,
          tasks: [],
          completed: false
        },
        // Days 1-7
        ...Array.from({ length: 7 }, (_, i) => {
          const dayNum = i + 1;
          return {
            dayOfWeek: dayNum,
            isRestDay: newPlanRestDays.includes(dayNum),
            tasks: [],
            completed: false
          };
        })
      ]
    };

    const created = await onCreatePlan(newPlan);
    if (created) {
      setSelectedPlanId(created.id);
      setShowCreateModal(false);
      setNewPlanTitle("");
      setNewPlanRestDays([6, 7]);
    }
  };

  const handleDeletePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(localT[lang].deletePlanConfirm)) {
      await onDeletePlan(id);
      if (selectedPlanId === id) {
        setSelectedPlanId(null);
      }
    }
  };

  const handleToggleArchivePlan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = plans.find(p => p.id === id);
    if (!target) return;
    await onUpdatePlan(id, {
      status: target.status === "active" ? "archived" : "active"
    });
  };

  // Toggle single task completion (调 PATCH /tasks/:taskId)
  const handleToggleTask = async (dayNum: number, taskId: string) => {
    if (!currentPlan) return;
    const day = currentPlan.days.find(d => d.dayOfWeek === dayNum);
    const task = day?.tasks.find(t => t.id === taskId);
    if (!task) return;
    await onSaveTask(currentPlan.id, { ...task, completed: !task.completed }, dayNum, task.id && day ? day.tasks.findIndex(t => t.id === taskId) : 0);
  };

  // Quick Inline Add Task (调 POST /tasks)
  const handleQuickAddTask = async (dayNum: number, titleText: string, type: TaskType) => {
    if (!currentPlan) return;

    const newTask: LearningTask = {
      id: "task-" + Date.now(),
      type,
      title: titleText.trim(),
      completed: false
    };

    await onSaveTask(currentPlan.id, newTask, dayNum, 0);
    setActiveInlineAddDayNum(null);
  };

  // Move task to a different day column (PATCH 新位置 + DELETE 旧位置由后端 upsert 合并)
  const handleMoveTask = async (fromDayNum: number, taskId: string, toDayNum: number) => {
    if (!currentPlan) return;
    const fromDay = currentPlan.days.find(d => d.dayOfWeek === fromDayNum);
    const taskToMove = fromDay?.tasks.find(t => t.id === taskId);
    if (!taskToMove) return;
    await onSaveTask(currentPlan.id, taskToMove, toDayNum, 0);
  };

  // Toggle Day Check-in directly (调 PATCH /days/:day)
  const handleToggleDayComplete = async (dayNum: number) => {
    if (!currentPlan) return;
    const day = currentPlan.days.find(d => d.dayOfWeek === dayNum);
    if (!day) return;
    const newCompleted = !day.completed;
    // 一键打卡时,同步把当天所有任务标记完成
    if (newCompleted) {
      for (const t of day.tasks) {
        if (!t.completed) {
          await onSaveTask(currentPlan.id, { ...t, completed: true }, dayNum, 0);
        }
      }
    }
    await onUpdateDayMeta(currentPlan.id, dayNum, { completed: newCompleted });
  };

  // Toggle Rest Day status
  const handleToggleRestDay = async (dayNum: number) => {
    if (!currentPlan) return;
    const day = currentPlan.days.find(d => d.dayOfWeek === dayNum);
    if (!day) return;
    const newIsRest = !day.isRestDay;
    await onUpdateDayMeta(currentPlan.id, dayNum, {
      isRestDay: newIsRest,
      completed: newIsRest ? false : day.completed
    });
  };

  // Advanced Task Creation & Editing Dialog Trigger (只设本地 UI state)
  const openTaskForm = (dayNum: number, type: TaskType, task?: LearningTask) => {
    setEditingDayNum(dayNum);
    setEditingTaskType(type);
    if (task) {
      setEditingTask(task);
      setTaskTitle(task.title);
      setTaskDesc(task.description || "");
      setSelectedWordIds(task.linkedWordIds || []);
    } else {
      setEditingTask(null);
      setTaskTitle("");
      setTaskDesc("");
      setSelectedWordIds([]);
    }
    setWordSearchQuery("");
    setShowTaskForm(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlan || editingDayNum === null || editingTaskType === null) return;
    if (!taskTitle.trim()) return;

    const taskData: LearningTask = editingTask
      ? {
          ...editingTask,
          title: taskTitle,
          description: taskDesc,
          linkedWordIds: selectedWordIds.length > 0 ? selectedWordIds : undefined
        }
      : {
          id: "task-" + Date.now(),
          type: editingTaskType,
          title: taskTitle,
          description: taskDesc,
          completed: false,
          linkedWordIds: selectedWordIds.length > 0 ? selectedWordIds : undefined
        };

    await onSaveTask(currentPlan.id, taskData, editingDayNum, 0);

    setShowTaskForm(false);
    setEditingDayNum(null);
    setEditingTaskType(null);
    setEditingTask(null);
  };

  const handleDeleteTask = async (dayNum: number, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPlan) return;
    if (!confirm(localT[lang].deleteTaskConfirm)) return;
    await onDeleteTask(currentPlan.id, taskId);
  };

  const handleAddTaskType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    if (isSavingType) return; // 防止重复点击

    const newId = "type-" + Date.now();
    const newType: TaskTypeConfig = {
      id: newId,
      label: newTypeName.trim(),
      icon: newTypeIcon,
      color: newTypeColor,
      // 显式带上 sortOrder,避免依赖后端补默认值
      sortOrder: taskTypes.length
    };

    const ok = await saveTaskTypes(
      [...taskTypes, newType],
      `已添加「${newType.label}」类型`
    );
    if (ok) {
      setNewTypeName("");
    }
  };

  const handleDeleteTaskType = async (id: string) => {
    if (taskTypes.length <= 1) {
      alert(configT[lang].cantDeleteLast);
      return;
    }
    if (isSavingType) return;
    const target = taskTypes.find(t => t.id === id);
    const updated = taskTypes.filter(t => t.id !== id);
    await saveTaskTypes(updated, target ? `已删除「${target.label}」` : "已删除");
  };

  const handleResetTaskTypes = async () => {
    if (isSavingType) return;
    if (confirm("确定要恢复默认任务类型吗？自定义的类型将被删除。")) {
      await saveTaskTypes(DEFAULT_TASK_TYPES, "已恢复默认类型");
    }
  };

  const filteredWords = words.filter(w => {
    if (!wordSearchQuery) return true;
    const query = wordSearchQuery.toLowerCase();
    return (
      w.spelling.toLowerCase().includes(query) ||
      w.definition.toLowerCase().includes(query)
    );
  });

  const toggleLinkWord = (wordId: string) => {
    if (selectedWordIds.includes(wordId)) {
      setSelectedWordIds(selectedWordIds.filter(id => id !== wordId));
    } else {
      setSelectedWordIds([...selectedWordIds, wordId]);
    }
  };

  // Helper: Count finished days
  const getPlanProgress = (plan: LearningPlan) => {
    const totalDays = 7;
    const completedDays = plan.days.filter(d => d.dayOfWeek !== 0 && d.completed).length;
    const percent = Math.round((completedDays / totalDays) * 100);
    return { completedDays, percent };
  };

  // Icon selector based on type
  const getTaskIcon = (type: TaskType) => {
    const matched = taskTypes.find(t => t.id === type);
    const iconName = matched?.icon || "CheckSquare";
    const colorName = matched?.color || "teal";

    const presetIcon = PRESET_ICONS.find(pi => pi.name === iconName);
    const IconComp = presetIcon ? presetIcon.component : CheckSquare;

    const presetColor = PRESET_COLORS.find(pc => pc.name === colorName);
    const textColorClass = presetColor ? presetColor.textClass : "text-teal-500";

    return <IconComp className={`w-4 h-4 ${textColorClass}`} />;
  };

  const getTaskTypeLabel = (type: TaskType) => {
    const matched = taskTypes.find(t => t.id === type);
    if (matched) return matched.label;
    return (localT[lang] as Record<string, string>)[type] || type;
  };

  const getTaskTypeBorderColor = (type: TaskType) => {
    const matched = taskTypes.find(t => t.id === type);
    const colorName = matched?.color || "teal";
    const presetColor = PRESET_COLORS.find(pc => pc.name === colorName);
    return presetColor ? presetColor.borderClass : "border-l-teal-500";
  };

  const getTodayDayOfWeek = () => {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon, etc.
    return day === 0 ? 7 : day;
  };

  // Calculate actual dates for the day columns based on plan start date
  const getColumnDateStr = (startDateStr: string, dayNum: number) => {
    if (dayNum === 0) return ""; // Inbox
    try {
      const start = new Date(startDateStr);
      const current = new Date(start.getTime() + (dayNum - 1) * 24 * 60 * 60 * 1000);
      const locale = lang === "zh" ? "zh-CN" : lang === "ja" ? "ja-JP" : lang === "es" ? "es-ES" : lang === "fr" ? "fr-FR" : lang === "pt" ? "pt-PT" : "en-US";
      return current.toLocaleDateString(locale, {
        month: "short",
        day: "numeric"
      });
    } catch {
      return "";
    }
  };

  const safeDays = currentPlan ? getPlanDaysWithInbox(currentPlan) : [];

  // Helper function to safely extract and sort day plans so Inbox is first, followed by Mon-Sun
  function getPlanDaysWithInbox(plan: LearningPlan): DayPlan[] {
    const fullDays: DayPlan[] = [];

    let inbox = plan.days.find(d => d.dayOfWeek === 0);
    if (!inbox) {
      inbox = { dayOfWeek: 0, isRestDay: false, tasks: [], completed: false };
    }
    fullDays.push(inbox);

    for (let i = 1; i <= 7; i++) {
      let day = plan.days.find(d => d.dayOfWeek === i);
      if (!day) {
        day = { dayOfWeek: i, isRestDay: false, tasks: [], completed: false };
      }
      fullDays.push(day);
    }
    return fullDays;
  }

  // 获取当前语言下星期名称
  const getDayName = (dayObj: typeof DAYS_NAME[number] | undefined) => {
    if (!dayObj) return "";
    return (dayObj as any)[lang] || dayObj.en;
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast 提示(乐观更新成功/失败反馈) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold ${
              toast.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4" />
            ) : (
              <X className="w-4 h-4" />
            )}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            {localT[lang].back}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title={isSidebarOpen ? localT[lang].collapse : localT[lang].expand}
          >
            <Menu className="w-4 h-4 text-indigo-500" />
            <span>{isSidebarOpen ? localT[lang].collapse : localT[lang].expand}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-base text-slate-800 leading-snug">
              {localT[lang].plansTitle}
            </h1>
            <p className="text-[11px] text-slate-400 font-light max-w-sm sm:max-w-md truncate">
              {localT[lang].plansSubtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/10 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          {localT[lang].createPlan}
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left column: Plans List Panel (Collapsible) */}
        {isSidebarOpen && (
          <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {localT[lang].allPlans}
            </h2>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {plans.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-light">
                  暂无学习计划，快去新建一个吧！
                </div>
              ) : (
                plans.map((p) => {
                  const { completedDays, percent } = getPlanProgress(p);
                  const isSelected = p.id === selectedPlanId;
                  const isActive = p.status === "active";

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative overflow-hidden group ${
                        isSelected
                          ? "bg-indigo-50/20 border-indigo-200 shadow-sm ring-1 ring-indigo-500/5"
                          : "bg-white border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-600" />
                      )}

                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-bold text-slate-800 text-[11px] leading-tight line-clamp-1 flex-grow">
                          {p.title}
                        </h3>
                        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleToggleArchivePlan(p.id, e)}
                            title={isActive ? localT[lang].archive : localT[lang].unarchive}
                            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                          >
                            <Archive className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePlan(p.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                        {p.startDate} ~ {p.endDate}
                      </div>

                      {/* Progress bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                          <span>{localT[lang].progress}</span>
                          <span className="font-mono">{percent}% ({completedDays}/7)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task Types Configuration entry */}
            <div className="border-t border-slate-100 pt-4 mt-2">
              <button
                onClick={() => {
                  setShowTypeConfigModal(true);
                  setNewTypeName("");
                  setNewTypeIcon("CheckSquare");
                  setNewTypeColor("teal");
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-indigo-600 rounded-xl text-[11px] font-bold shadow-sm transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:rotate-45 transition-all duration-300" />
                  <span>{configT[lang].manageTypes}</span>
                </div>
                <span className="text-[10px] bg-slate-200/60 text-slate-500 font-bold px-2 py-0.5 rounded-full font-mono group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                  {taskTypes.length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Right Arena: WeekTodo Side-by-Side 8 Columns Board */}
        <div className={`${isSidebarOpen ? "lg:col-span-9" : "lg:col-span-12"} space-y-4 min-w-0`}>
          {currentPlan ? (
            <div className="space-y-4">

              {/* Active Plan Stats Ribbon */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800 text-sm">
                      {currentPlan.title}
                    </h2>
                    <span className={`px-2 py-0.5 text-[9px] rounded-full font-bold ${
                      currentPlan.status === "active" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500"
                    }`}>
                      {currentPlan.status === "active" ? localT[lang].active : localT[lang].archived}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-light">
                    {currentPlan.startDate} 至 {currentPlan.endDate}
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      {localT[lang].progress}
                    </span>
                    <span className="text-xs font-bold text-indigo-600 font-mono">
                      {getPlanProgress(currentPlan).percent}% ({getPlanProgress(currentPlan).completedDays}/7天)
                    </span>
                  </div>
                  <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${getPlanProgress(currentPlan).percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* WEEK PLAN BOARD (WeekTodo Kanban Layout) */}
              <div className="bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                <div className="flex gap-4 overflow-x-auto pb-6 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200">
                  {safeDays.map((d) => {
                    const isInbox = d.dayOfWeek === 0;
                    const dayNameObj = DAYS_NAME.find(dn => dn.value === d.dayOfWeek);
                    const isToday = !isInbox && d.dayOfWeek === getTodayDayOfWeek();

                    return (
                      <div
                        key={d.dayOfWeek}
                        className={`w-[290px] sm:w-[310px] shrink-0 bg-white border p-4 rounded-2xl flex flex-col snap-align-start transition-all relative min-h-[420px] ${
                          isToday
                            ? "border-indigo-200 shadow-md ring-1 ring-indigo-500/10"
                            : "border-slate-100 shadow-sm hover:border-slate-200/80"
                        }`}
                      >
                        {/* Glowing today badge */}
                        {isToday && (
                          <div className="absolute -top-2 left-4 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-bold rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                            {localT[lang].today}
                          </div>
                        )}

                        {/* Column Header */}
                        <div className="flex justify-between items-start pb-2.5 border-b border-slate-50 mb-3 shrink-0">
                          <div className="space-y-0.5 text-left">
                            <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              {isInbox ? (
                                <>
                                  <Inbox className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>{localT[lang].inbox}</span>
                                </>
                              ) : (
                                <span>{getDayName(dayNameObj)}</span>
                              )}
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {isInbox ? localT[lang].inboxDesc : getColumnDateStr(currentPlan.startDate, d.dayOfWeek)}
                            </p>
                          </div>

                          {/* Check-in and Rest day action menu */}
                          {!isInbox && (
                            <div className="flex items-center gap-1">
                              {d.isRestDay && (
                                <span className="p-1 bg-amber-50 rounded-lg text-amber-600" title={localT[lang].restDay}>
                                  <Coffee className="w-3.5 h-3.5" />
                                </span>
                              )}

                              <button
                                onClick={() => handleToggleRestDay(d.dayOfWeek)}
                                title={d.isRestDay ? localT[lang].workDay : localT[lang].restDay}
                                className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                                  d.isRestDay
                                    ? "bg-amber-50 border-amber-200 text-amber-600"
                                    : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <Coffee className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleDayComplete(d.dayOfWeek)}
                                title={d.completed ? localT[lang].completed : localT[lang].today}
                                className={`p-1 rounded-lg border cursor-pointer transition-colors ${
                                  d.completed
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                                    : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Column Tasks List */}
                        <div className="flex-grow space-y-2.5 overflow-y-auto max-h-[340px] pr-0.5">
                          {d.tasks.length === 0 ? (
                            <div className="h-full py-10 flex flex-col items-center justify-center text-center opacity-40">
                              <CheckSquare className="w-8 h-8 text-slate-300 stroke-[1.5]" />
                              <span className="text-[10px] text-slate-400 font-light mt-1.5">No tasks planned</span>
                            </div>
                          ) : (
                            d.tasks.map((t) => {
                              const linkedWordsList = words.filter(w => t.linkedWordIds?.includes(w.id));

                              return (
                                <div
                                  key={t.id}
                                  className={`p-3 rounded-xl border-l-4 border-slate-100 bg-white shadow-sm hover:shadow transition-all relative group text-left ${
                                    getTaskTypeBorderColor(t.type)
                                  } ${t.completed ? "opacity-60 bg-slate-50/50" : ""}`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    {/* Custom Checkbox */}
                                    <button
                                      onClick={() => handleToggleTask(d.dayOfWeek, t.id)}
                                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                        t.completed
                                          ? "bg-indigo-600 border-indigo-600 text-white"
                                          : "border-slate-300 hover:border-slate-400 bg-white"
                                      }`}
                                    >
                                      {t.completed && <Check className="w-3 h-3 stroke-[3]" />}
                                    </button>

                                    {/* Task text */}
                                    <div className="flex-grow min-w-0">
                                      <h4 className={`text-xs font-bold leading-relaxed text-slate-800 break-words ${
                                        t.completed ? "line-through text-slate-400 font-medium" : ""
                                      }`}>
                                        {t.title}
                                      </h4>
                                      {t.description && (
                                        <p className={`text-[10px] text-slate-400 font-light leading-normal mt-1 truncate ${
                                          t.completed ? "line-through text-slate-300" : ""
                                        }`} title={t.description}>
                                          {t.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task Type badge */}
                                  <div className="mt-1.5 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-medium font-light">
                                      {getTaskIcon(t.type)}
                                      <span>{getTaskTypeLabel(t.type)}</span>
                                    </span>
                                  </div>

                                  {/* Vocab review trigger */}
                                  {linkedWordsList.length > 0 && (
                                    <div className="mt-2.5 pt-2 border-t border-slate-50 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-0.5">
                                          <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                                          {localT[lang].linkVocabLabel} ({linkedWordsList.length})
                                        </span>

                                        <button
                                          onClick={() => onStartCustomReview(linkedWordsList.map(w => w.id), t.id, d.dayOfWeek, currentPlan.id)}
                                          className="inline-flex items-center gap-0.5 text-[8px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-0.5 px-2 rounded-full transition-all cursor-pointer"
                                        >
                                          <Play className="w-2 h-2 fill-indigo-600" />
                                          {localT[lang].oneClickReview}
                                        </button>
                                      </div>

                                      {/* Small horizontal words flow */}
                                      <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                                        {linkedWordsList.map(w => (
                                          <span
                                            key={w.id}
                                            className="inline-flex flex-col px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-[9px] text-slate-600"
                                            title={w.definition}
                                          >
                                            <span className="font-bold text-slate-700 font-mono">
                                              {w.spelling}
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action buttons (Appear on Hover) */}
                                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                    {/* Move to another day */}
                                    <button
                                      onClick={() => setActiveMoveTask({ dayNum: d.dayOfWeek, taskId: t.id })}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                                      title={localT[lang].moveTo}
                                    >
                                      <Move className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={() => openTaskForm(d.dayOfWeek, t.type, t)}
                                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-50 cursor-pointer"
                                      title={localT[lang].editTask}
                                    >
                                      <Bookmark className="w-3 h-3" />
                                    </button>

                                    <button
                                      onClick={(e) => handleDeleteTask(d.dayOfWeek, t.id, e)}
                                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 cursor-pointer"
                                      title={localT[lang].delete}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Move Task Dropdown Overlay */}
                                  {activeMoveTask && activeMoveTask.dayNum === d.dayOfWeek && activeMoveTask.taskId === t.id && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-20"
                                        onClick={() => setActiveMoveTask(null)}
                                      />
                                      <div className="absolute right-2 top-8 w-44 bg-white rounded-xl border border-slate-100 shadow-xl p-1.5 z-30 space-y-0.5 animate-fade-in text-left">
                                        <div className="px-2 py-1 mb-1 border-b border-slate-50">
                                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                            {localT[lang].moveTo}
                                          </span>
                                        </div>
                                        {[0, 1, 2, 3, 4, 5, 6, 7].map((targetDayNum) => {
                                          if (targetDayNum === d.dayOfWeek) return null;
                                          const dayName = DAYS_NAME.find(dn => dn.value === targetDayNum);
                                          return (
                                            <button
                                              key={targetDayNum}
                                              onClick={() => {
                                                handleMoveTask(d.dayOfWeek, t.id, targetDayNum);
                                                setActiveMoveTask(null);
                                              }}
                                              className="w-full text-left px-2 py-1 rounded-lg text-[10px] text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer flex items-center justify-between"
                                            >
                                              <span>{targetDayNum === 0 ? localT[lang].inbox : getDayName(dayName)}</span>
                                              <span className="text-[8px] text-slate-400 font-mono">
                                                {targetDayNum === 0 ? "📥" : `Day ${targetDayNum}`}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Column Bottom Inline Add Form */}
                        <div className="mt-3 shrink-0">
                          {activeInlineAddDayNum === d.dayOfWeek ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (inlineTaskTitle.trim()) {
                                  handleQuickAddTask(d.dayOfWeek, inlineTaskTitle, inlineTaskType);
                                  setInlineTaskTitle("");
                                }
                              }}
                              className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 shadow-inner space-y-2 animate-fade-in text-left"
                            >
                              <input
                                type="text"
                                autoFocus
                                required
                                value={inlineTaskTitle}
                                onChange={(e) => setInlineTaskTitle(e.target.value)}
                                placeholder={localT[lang].addTaskPlaceholder}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                              />

                              <div className="flex justify-between items-center gap-1.5 pt-1">
                                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-100 flex-wrap max-w-[170px]">
                                  {taskTypes.map((typeConfig) => {
                                    const type = typeConfig.id;
                                    const isSelected = inlineTaskType === type;
                                    return (
                                      <button
                                        key={type}
                                        type="button"
                                        onClick={() => setInlineTaskType(type)}
                                        title={typeConfig.label}
                                        className={`p-1 rounded-md transition-all cursor-pointer ${
                                          isSelected
                                            ? "bg-indigo-50 text-indigo-600 scale-105"
                                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        }`}
                                      >
                                        {getTaskIcon(type)}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="flex gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      openTaskForm(d.dayOfWeek, inlineTaskType);
                                      setActiveInlineAddDayNum(null);
                                    }}
                                    className="px-2 py-1 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    {localT[lang].editTask}
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] cursor-pointer shadow-sm shadow-indigo-600/15"
                                  >
                                    {localT[lang].add}
                                  </button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <button
                              onClick={() => {
                                setActiveInlineAddDayNum(d.dayOfWeek);
                                setInlineTaskTitle("");
                                if (taskTypes.length > 0) {
                                  setInlineTaskType(taskTypes[0].id);
                                } else {
                                  setInlineTaskType("shortTask");
                                }
                              }}
                              className="w-full py-1.5 border border-dashed border-slate-200 hover:border-indigo-200 hover:bg-indigo-50/10 text-[11px] text-slate-400 hover:text-indigo-600 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer font-medium"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {localT[lang].addTaskPlaceholder}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4">
              <CalendarRange className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
              <h3 className="font-display font-bold text-slate-700">{localT[lang].noPlanSelected}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
                {localT[lang].plansSubtitle}
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {localT[lang].createPlan}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Weekly Plan Creator Dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-display font-bold text-slate-800">{localT[lang].addPlanTitle}</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    {localT[lang].titleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPlanTitle}
                    onChange={(e) => setNewPlanTitle(e.target.value)}
                    placeholder={localT[lang].titlePlaceholder}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    {localT[lang].startDateLabel}
                  </label>
                  <input
                    type="date"
                    required
                    value={newPlanStartDate}
                    onChange={(e) => setNewPlanStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    {localT[lang].restDaysLabel}
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {DAYS_NAME.map((d) => {
                      const isChecked = newPlanRestDays.includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setNewPlanRestDays(newPlanRestDays.filter(val => val !== d.value));
                            } else {
                              setNewPlanRestDays([...newPlanRestDays, d.value]);
                            }
                          }}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-semibold text-center cursor-pointer transition-all ${
                            isChecked
                              ? "bg-amber-50 border-amber-300 text-amber-700 font-bold"
                              : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {(d as any)[lang] ? (d as any)[lang].slice(0, 3) : d.en.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    {localT[lang].cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/10"
                  >
                    {localT[lang].confirm}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Task Form Editor with Vocabulary Search */}
      <AnimatePresence>
        {showTaskForm && editingDayNum !== null && editingTaskType !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTaskForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-4 text-left max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 shrink-0">
                <div className="flex items-center gap-1.5">
                  {getTaskIcon(editingTaskType)}
                  <h3 className="font-display font-bold text-slate-800">
                    {editingTask ? localT[lang].editTask : localT[lang].add} {getTaskTypeLabel(editingTaskType)}
                  </h3>
                </div>
                <button
                  onClick={() => setShowTaskForm(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-4 overflow-y-auto flex-grow pr-1.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    {localT[lang].taskTitleLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={localT[lang].titlePlaceholder}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">
                    {localT[lang].taskDescLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    placeholder={localT[lang].taskDescLabel}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                      {localT[lang].linkVocabLabel}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {localT[lang].linkedWordsCount.replace("{count}", String(selectedWordIds.length))}
                    </span>
                  </div>

                  {selectedWordIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {selectedWordIds.map(id => {
                        const w = words.find(item => item.id === id);
                        if (!w) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-bold rounded-lg"
                          >
                            <span className="font-mono">{w.spelling}</span>
                            <button
                              type="button"
                              onClick={() => toggleLinkWord(id)}
                              className="text-violet-400 hover:text-rose-500 font-black cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={wordSearchQuery}
                        onChange={(e) => setWordSearchQuery(e.target.value)}
                        placeholder={localT[lang].searchVocabPlaceholder}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="max-h-[140px] overflow-y-auto border border-slate-150 rounded-xl bg-white p-2.5 space-y-2.5">
                      {filteredWords.length === 0 ? (
                        <div className="text-center py-4 text-[10px] text-slate-400 font-light">
                          {localT[lang].searchVocabPlaceholder}
                        </div>
                      ) : (
                        filteredWords.slice(0, 100).map(w => {
                          const isLinked = selectedWordIds.includes(w.id);
                          return (
                            <div
                              key={w.id}
                              onClick={() => toggleLinkWord(w.id)}
                              className={`flex justify-between items-center p-2 rounded-lg text-left cursor-pointer transition-all ${
                                isLinked
                                  ? "bg-violet-50/50 hover:bg-violet-50 border border-violet-200"
                                  : "hover:bg-slate-50 border border-transparent"
                              }`}
                            >
                              <div>
                                <div className="text-xs font-bold font-mono text-slate-800 flex items-center gap-1.5">
                                  {w.spelling}
                                  {w.phonetic && (
                                    <span className="text-[10px] font-light font-sans text-slate-400">
                                      {w.phonetic}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                  {w.definition}
                                </div>
                              </div>
                              <div className={`p-1 rounded-full border ${
                                isLinked
                                  ? "bg-violet-600 border-violet-600 text-white"
                                  : "border-slate-200 text-slate-400 hover:bg-slate-100"
                              }`}>
                                {isLinked ? (
                                  <Check className="w-3 h-3 font-bold" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  >
                    {localT[lang].cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/10"
                  >
                    {localT[lang].saveTask}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Task Types Configuration Modal */}
      <AnimatePresence>
        {showTypeConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTypeConfigModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-10 space-y-5 text-left max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-50 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500 animate-spin-slow" />
                  <h3 className="font-display font-bold text-slate-800">
                    {configT[lang].manageTypes}
                  </h3>
                </div>
                <button
                  onClick={() => setShowTypeConfigModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-6 overflow-y-auto flex-grow pr-1">
                <p className="text-[11px] text-slate-400 font-light">
                  {configT[lang].typesDesc}
                </p>

                {/* Form to Add New Type */}
                <form onSubmit={handleAddTaskType} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-indigo-500" />
                    {configT[lang].addType}
                  </h4>

                  {/* Input Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {configT[lang].typeName}
                    </label>
                    <input
                      type="text"
                      required
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder={configT[lang].typePlaceholder}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                    />
                  </div>

                  {/* Select Icon */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {configT[lang].selectIcon}
                    </label>
                    <div className="grid grid-cols-7 sm:grid-cols-9 gap-1.5 bg-white p-2 rounded-xl border border-slate-150">
                      {PRESET_ICONS.map((pi) => {
                        const IconComponent = pi.component;
                        const isSelected = newTypeIcon === pi.name;
                        return (
                          <button
                            key={pi.name}
                            type="button"
                            onClick={() => setNewTypeIcon(pi.name)}
                            title={pi.name}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-indigo-50 border-indigo-200 text-indigo-600 scale-105 shadow-sm"
                                : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Select Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block">
                      {configT[lang].selectColor}
                    </label>
                    <div className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-slate-150">
                      {PRESET_COLORS.map((pc) => {
                        const isSelected = newTypeColor === pc.name;
                        const colorMap: Record<string, string> = {
                          teal: "#14b8a6", amber: "#f59e0b", rose: "#f43f5e",
                          violet: "#8b5cf6", emerald: "#10b981", blue: "#3b82f6",
                          indigo: "#6366f1", pink: "#ec4899", orange: "#f97316", sky: "#0ea5e9"
                        };
                        return (
                          <button
                            key={pc.name}
                            type="button"
                            onClick={() => setNewTypeColor(pc.name)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${pc.bgClass} border-2 ${
                              isSelected
                                ? "border-indigo-500 scale-110 shadow-sm"
                                : "border-slate-200 hover:scale-105"
                            }`}
                            title={pc.name}
                          >
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorMap[pc.name] }} />
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white drop-shadow-sm font-black" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingType || !newTypeName.trim()}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                      isSavingType
                        ? "bg-slate-400 text-slate-100 cursor-not-allowed shadow-none"
                        : !newTypeName.trim()
                        ? "bg-slate-300 text-slate-400 cursor-not-allowed shadow-none"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10 cursor-pointer active:scale-[0.98]"
                    }`}
                  >
                    {isSavingType ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        保存中...
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        {configT[lang].confirmAdd}
                      </>
                    )}
                  </button>
                </form>

                {/* Existing Types List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-700">{configT[lang].manageTypes}</h4>
                  <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl bg-white overflow-hidden">
                    {taskTypes.map((type) => {
                      const matchedColor = PRESET_COLORS.find(pc => pc.name === type.color);
                      const matchedIconObj = PRESET_ICONS.find(pi => pi.name === type.icon);
                      const IconComponent = matchedIconObj ? matchedIconObj.component : CheckSquare;
                      return (
                        <div key={type.id} className="flex justify-between items-center p-3 hover:bg-slate-50 transition-colors text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-xl ${matchedColor?.bgClass || "bg-slate-50"}`}>
                              <IconComponent className={`w-4 h-4 ${matchedColor?.textClass || "text-slate-500"}`} />
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{type.label}</div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">ID: {type.id} | Color: {type.color}</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteTaskType(type.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                            title={configT[lang].delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50 shrink-0 gap-3">
                <button
                  type="button"
                  onClick={handleResetTaskTypes}
                  disabled={isSavingType}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSavingType
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                  }`}
                >
                  {configT[lang].resetDefault}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTypeConfigModal(false)}
                  disabled={isSavingType}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSavingType
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-800 hover:bg-slate-900 text-white cursor-pointer active:scale-[0.98] shadow-md"
                  }`}
                >
                  {isSavingType ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      {configT[lang].save}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
