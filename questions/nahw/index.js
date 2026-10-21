
/* سجل مراحل النحو — يقوم بتعريف دالة التسجيل الخاصة بمسار النحو */
window.registerNahwStage = window.registerNahwStage || function(stageData) {
    window.stagesDatabase = window.stagesDatabase || { nahw: [], sarf: [] };
    window.stagesDatabase.nahw.push(stageData);
};
