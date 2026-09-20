import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "en" | "zh";

// ─── Translation dictionary ────────────────────────────────────────────────────
// All strings are written by hand — no machine translation.
// 所有中文字符串均为人工翻译，非机器翻译。
export const translations = {
  en: {
    // Nav
    nav_dashboard: "Dashboard",
    nav_contacts: "Contacts",
    nav_import: "Import",
    nav_coffee_chat: "Coffee Chats",
    nav_outreach: "Outreach",
    nav_notebook: "Notebook",
    nav_recommendations: "Recommendations",
    nav_settings: "Settings",
    nav_workspace: "Workspace",
    nav_demo_mode: "Private Workspace",
    nav_sign_out: "out",
    nav_tagline: "Turn every coffee chat into real learnings",

    // Dashboard
    dash_greeting_prefix: "Hi,",
    dash_tagline: "Turn every coffee chat into real learnings.",
    dash_import_contacts: "Import Contacts",
    dash_log_chat: "Log Coffee Chat",
    dash_generate_outreach: "Generate Outreach",
    dash_stat_contacts: "Contacts",
    dash_stat_contacts_sub: "imported",
    dash_stat_followups: "Follow-ups",
    dash_stat_followups_sub: "due",
    dash_stat_chats: "Chats",
    dash_stat_chats_sub: "summarized",
    dash_stat_chatted: "Chatted",
    dash_stat_chatted_sub: "conversations",
    dash_timeline_title: "Recruiting Timeline",
    dash_timeline_refresh: "Refresh",
    dash_timeline_fetching: "Fetching...",
    dash_timeline_empty: "No timeline loaded yet. Click Refresh to fetch the latest recruiting timeline.",
    dash_timeline_fetch_btn: "Fetch Recruiting Timeline",
    dash_recent_contacts: "Recent Contacts",
    dash_view_all: "View all",
    dash_followup_queue: "Today's Follow-up Queue",
    dash_no_followups: "No follow-ups due today.",
    dash_groups_not_covered: "Groups Not Covered",
    dash_all_groups_covered: "All major groups covered!",
    dash_next_best: "Next Best to Contact",
    dash_log_more_chats: "Log more chats to get recommendations.",
    dash_view_all_recs: "View all recommendations",
    dash_col_name: "Name",
    dash_col_firm: "Firm",
    dash_col_group: "Group",
    dash_col_status: "Status",
    dash_no_contacts: "No contacts yet — import your spreadsheet to get started.",
    dash_show_more: "Show more",
    dash_show_less: "Show less",

    // Contacts
    contacts_title: "Contacts",
    contacts_subtitle_one: "contact in your network",
    contacts_subtitle_many: "contacts in your network",
    contacts_search: "Search name, firm, school...",
    contacts_all_statuses: "All statuses",
    contacts_all_groups: "All groups",
    contacts_all_firms: "All firms",
    contacts_delete_all: "Delete All",
    contacts_import: "Import",
    contacts_col_name: "Name",
    contacts_col_firm: "Firm",
    contacts_col_group: "Group",
    contacts_col_role: "Role",
    contacts_col_school: "School",
    contacts_col_status: "Status",
    contacts_col_actions: "Actions",
    contacts_no_results: "No contacts match your filters.",
    contacts_prev: "Previous",
    contacts_next: "Next",

    // Status labels
    status_not_started: "Not Started",
    status_reached_out: "Reached Out",
    status_chatted: "Chatted",
    status_following_up: "Following Up",
    status_closed: "Closed",

    // Coffee Chat
    chat_title: "Coffee Chats",
    chat_new: "New Chat",
    chat_no_chats: "No chats logged yet.",
    chat_select_contact: "Contact",
    chat_select_placeholder: "Select the banker you chatted with...",
    chat_quick_add: "Quick-add new contact",
    chat_mode_transcript: "Paste Transcript",
    chat_mode_notes: "Notes",
    chat_mode_audio: "Upload Audio",
    chat_submit: "Analyze & Save",
    chat_submitting: "Analyzing...",
    chat_transcript_placeholder: "Paste your coffee chat transcript here...\n\nExample:\nMe: What's your advice for breaking into TMT banking?\nSarah: Focus on deal exposure early — reach out in September.",
    chat_notes_placeholder: "Write your notes from the coffee chat here...\n\nExample:\n- Goldman TMT is very selective; reach out to recruiting in September\n- She offered to connect me with two other analysts in the group",
    chat_summary_title: "Summary",
    chat_transcript_title: "Transcript",
    chat_takeaways_title: "Takeaways",
    chat_emails_title: "Emails",
    chat_generating: "Generating...",
    chat_extract_summary: "Extract Summary",
    chat_thank_you: "Thank You",
    chat_referral_ask: "Referral Ask",
    chat_copy: "Copy",
    chat_edit: "Edit",
    chat_save: "Save",
    chat_cancel: "Cancel",
    chat_back: "Back to chats",
    chat_date: "Chat Date",
    chat_add_contact: "Add New Contact",

    // Notebook
    notebook_title: "Notebook",
    notebook_subtitle: "All takeaways from your coffee chats — click any card to edit",
    notebook_flat_view: "Flat view",
    notebook_grouped_view: "Grouped view",
    notebook_takeaways: "takeaways",
    notebook_key_insights: "key insights",
    notebook_categories: "categories",
    notebook_all_categories: "All Categories",
    notebook_all_firms: "All Firms",
    notebook_key_only: "Key insights only",
    notebook_clear: "Clear",
    notebook_hover_hint: "Hover any card to edit · click ★ to mark as key insight",
    notebook_empty: "No takeaways yet.",
    notebook_empty_sub: "Log a coffee chat and analyze the transcript to populate your notebook.",
    notebook_copy: "Copy",
    notebook_edit_save: "Save",
    notebook_edit_cancel: "Cancel",

    // Outreach
    outreach_title: "Outreach",
    outreach_subtitle: "AI-generated emails for every stage of your recruiting journey",
    outreach_cold: "Cold Outreach",
    outreach_followup: "Follow-up",
    outreach_thankyou: "Thank You",
    outreach_referral: "Referral Ask",
    outreach_generate: "Generate",
    outreach_generating: "Generating...",
    outreach_copy: "Copy",
    outreach_approve: "Approve",
    outreach_edit: "Edit",
    outreach_save: "Save",
    outreach_cancel: "Cancel",
    outreach_select_contact: "Select a contact...",
    outreach_no_drafts: "No email drafts yet.",

    // Settings
    settings_title: "Settings",
    settings_profile: "Profile",
    settings_school: "School",
    settings_major: "Major",
    settings_club: "Club / Society",
    settings_hometown: "Hometown",
    settings_target_firm: "Target Firm",
    settings_target_group: "Target Group",
    settings_save: "Save",
    settings_saved: "Saved!",

    // Recommendations
    recs_title: "Recommendations",
    recs_subtitle: "Contacts you should prioritize reaching out to",
    recs_no_recs: "No recommendations yet.",
    recs_priority_high: "High",
    recs_priority_medium: "Medium",
    recs_priority_low: "Low",
    recs_reach_out: "Reach Out",

    // Import
    import_title: "Import Contacts",
    import_subtitle: "Upload a spreadsheet or paste LinkedIn data",
    import_upload: "Upload CSV / Excel",
    import_paste: "Paste Data",
    import_submit: "Import",
    import_importing: "Importing...",

    // Common
    common_loading: "Loading...",
    common_error: "Something went wrong.",
    common_back: "Back",
    common_close: "Close",
    common_delete: "Delete",
    common_confirm: "Confirm",
    common_sign_in: "Sign in to workspace",
    common_loading_workspace: "Loading workspace…",
    common_source: "Source",
    common_no_data: "No data available.",
  },

  zh: {
    // Nav
    nav_dashboard: "主页",
    nav_contacts: "联系人",
    nav_import: "导入",
    nav_coffee_chat: "咖啡聊天",
    nav_outreach: "邮件生成",
    nav_notebook: "笔记本",
    nav_recommendations: "推荐联系人",
    nav_settings: "设置",
    nav_workspace: "工作区",
    nav_demo_mode: "私人工作区",
    nav_sign_out: "退出",
    nav_tagline: "把每次咖啡聊天变成真正的收获",

    // Dashboard
    dash_greeting_prefix: "你好，",
    dash_tagline: "把每次咖啡聊天变成真正的收获。",
    dash_import_contacts: "导入联系人",
    dash_log_chat: "记录咖啡聊天",
    dash_generate_outreach: "生成邮件",
    dash_stat_contacts: "联系人",
    dash_stat_contacts_sub: "已导入",
    dash_stat_followups: "待跟进",
    dash_stat_followups_sub: "今日",
    dash_stat_chats: "聊天记录",
    dash_stat_chats_sub: "已分析",
    dash_stat_chatted: "已沟通",
    dash_stat_chatted_sub: "次对话",
    dash_timeline_title: "招聘时间线",
    dash_timeline_refresh: "刷新",
    dash_timeline_fetching: "获取中…",
    dash_timeline_empty: "暂无时间线数据。点击「刷新」获取最新招聘时间线。",
    dash_timeline_fetch_btn: "获取招聘时间线",
    dash_recent_contacts: "最近联系人",
    dash_view_all: "查看全部",
    dash_followup_queue: "今日跟进清单",
    dash_no_followups: "今日暂无待跟进事项。",
    dash_groups_not_covered: "尚未覆盖的部门",
    dash_all_groups_covered: "所有主要部门均已覆盖！",
    dash_next_best: "优先联系推荐",
    dash_log_more_chats: "多记录几次聊天，即可获得推荐。",
    dash_view_all_recs: "查看全部推荐",
    dash_col_name: "姓名",
    dash_col_firm: "公司",
    dash_col_group: "部门",
    dash_col_status: "状态",
    dash_no_contacts: "暂无联系人——请先导入你的表格。",
    dash_show_more: "展开更多",
    dash_show_less: "收起",

    // Contacts
    contacts_title: "联系人",
    contacts_subtitle_one: "位联系人",
    contacts_subtitle_many: "位联系人",
    contacts_search: "搜索姓名、公司、学校…",
    contacts_all_statuses: "所有状态",
    contacts_all_groups: "所有部门",
    contacts_all_firms: "所有公司",
    contacts_delete_all: "全部删除",
    contacts_import: "导入",
    contacts_col_name: "姓名",
    contacts_col_firm: "公司",
    contacts_col_group: "部门",
    contacts_col_role: "职位",
    contacts_col_school: "学校",
    contacts_col_status: "状态",
    contacts_col_actions: "操作",
    contacts_no_results: "没有符合筛选条件的联系人。",
    contacts_prev: "上一页",
    contacts_next: "下一页",

    // Status labels
    status_not_started: "未开始",
    status_reached_out: "已联系",
    status_chatted: "已聊天",
    status_following_up: "跟进中",
    status_closed: "已关闭",

    // Coffee Chat
    chat_title: "咖啡聊天",
    chat_new: "新建记录",
    chat_no_chats: "暂无聊天记录。",
    chat_select_contact: "联系人",
    chat_select_placeholder: "选择你聊天的银行家…",
    chat_quick_add: "快速添加新联系人",
    chat_mode_transcript: "粘贴对话记录",
    chat_mode_notes: "笔记",
    chat_mode_audio: "上传录音",
    chat_submit: "分析并保存",
    chat_submitting: "分析中…",
    chat_transcript_placeholder: "在此粘贴咖啡聊天的对话记录…\n\n示例：\n我：进入 TMT 投行有什么建议？\nSarah：尽早积累交易经验——九月份联系招聘团队。",
    chat_notes_placeholder: "在此记录咖啡聊天的笔记…\n\n示例：\n- 高盛 TMT 竞争激烈，九月联系招聘\n- 她愿意帮我介绍组内另外两位分析师",
    chat_summary_title: "摘要",
    chat_transcript_title: "对话记录",
    chat_takeaways_title: "关键收获",
    chat_emails_title: "邮件",
    chat_generating: "生成中…",
    chat_extract_summary: "提取摘要",
    chat_thank_you: "感谢信",
    chat_referral_ask: "内推请求",
    chat_copy: "复制",
    chat_edit: "编辑",
    chat_save: "保存",
    chat_cancel: "取消",
    chat_back: "返回聊天列表",
    chat_date: "聊天日期",
    chat_add_contact: "添加新联系人",

    // Notebook
    notebook_title: "笔记本",
    notebook_subtitle: "所有咖啡聊天的关键收获——点击任意卡片即可编辑",
    notebook_flat_view: "平铺视图",
    notebook_grouped_view: "分类视图",
    notebook_takeaways: "条收获",
    notebook_key_insights: "条重点",
    notebook_categories: "个分类",
    notebook_all_categories: "所有分类",
    notebook_all_firms: "所有公司",
    notebook_key_only: "仅显示重点",
    notebook_clear: "清除",
    notebook_hover_hint: "悬停卡片可编辑 · 点击 ★ 标记为重点",
    notebook_empty: "暂无收获记录。",
    notebook_empty_sub: "记录一次咖啡聊天并分析对话，即可填充笔记本。",
    notebook_copy: "复制",
    notebook_edit_save: "保存",
    notebook_edit_cancel: "取消",

    // Outreach
    outreach_title: "邮件生成",
    outreach_subtitle: "AI 为你的求职之旅生成各阶段邮件",
    outreach_cold: "初次联系",
    outreach_followup: "跟进邮件",
    outreach_thankyou: "感谢信",
    outreach_referral: "内推请求",
    outreach_generate: "生成",
    outreach_generating: "生成中…",
    outreach_copy: "复制",
    outreach_approve: "确认",
    outreach_edit: "编辑",
    outreach_save: "保存",
    outreach_cancel: "取消",
    outreach_select_contact: "选择联系人…",
    outreach_no_drafts: "暂无邮件草稿。",

    // Settings
    settings_title: "设置",
    settings_profile: "个人信息",
    settings_school: "学校",
    settings_major: "专业",
    settings_club: "社团 / 俱乐部",
    settings_hometown: "家乡",
    settings_target_firm: "目标公司",
    settings_target_group: "目标部门",
    settings_save: "保存",
    settings_saved: "已保存！",

    // Recommendations
    recs_title: "推荐联系人",
    recs_subtitle: "建议优先联系的对象",
    recs_no_recs: "暂无推荐。",
    recs_priority_high: "高优先级",
    recs_priority_medium: "中优先级",
    recs_priority_low: "低优先级",
    recs_reach_out: "立即联系",

    // Import
    import_title: "导入联系人",
    import_subtitle: "上传表格或粘贴 LinkedIn 数据",
    import_upload: "上传 CSV / Excel",
    import_paste: "粘贴数据",
    import_submit: "导入",
    import_importing: "导入中…",

    // Common
    common_loading: "加载中…",
    common_error: "出现错误，请重试。",
    common_back: "返回",
    common_close: "关闭",
    common_delete: "删除",
    common_confirm: "确认",
    common_sign_in: "登录工作区",
    common_loading_workspace: "加载工作区…",
    common_source: "来源",
    common_no_data: "暂无数据。",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

// ─── Context ──────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLang: () => {},
  t: (key) => translations.en[key],
});

const LANG_STORAGE_KEY = "coffeelab_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored === "en" || stored === "zh") return stored;
    } catch {}
    return "en";
  });

  useEffect(() => {
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch {}
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }, [lang]);

  function toggleLang() {
    setLang(l => l === "en" ? "zh" : "en");
  }

  function t(key: TranslationKey): string {
    return (translations[lang] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
