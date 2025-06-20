module.exports = function validateTodoInput(req, res, next) {
    const { text, dueDate, completed } = req.body;
  
    if (text !== undefined && (typeof text !== "string" || text.trim() === "")) {
      return res.status(400).json({ error: "빈 문자열이 될 수 없습니다." });
    }
    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
      return res.status(400).json({ error: "유효하지 않은 날짜 형식입니다." });
    }
    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({ error: "completed는 true 또는 false여야 합니다." });
    }
  
    next(); // 유효성 통과
  };