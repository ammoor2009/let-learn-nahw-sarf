/* سجل مراحل الصرف — يقوم بتعريف دالة التسجيل الخاصة بمسار الصرف */
window.registerSarfStage = window.registerSarfStage || function(stageData) {
    window.stagesDatabase = window.stagesDatabase || { nahw: [], sarf: [] };
    window.stagesDatabase.sarf.push(stageData);
};
