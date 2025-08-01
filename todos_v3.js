// To-Do List v3: 간단한 할 일 목록 관리 API

const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = 3000;

// 미들웨어 설정
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// JSON 파일 경로 설정
const todosFilePath = path.join(__dirname, "simple_todos.json");

async function loadTodos() {
  try {
    const data = await fs.readFile(todosFilePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(
        `[Todo] ${todosFilePath} 파일이 존재하지 않아 빈 목록으로 시작합니다.`
      );
      return [];
    }
    console.error("[Todo] 할 일 목록을 읽는 중 오류 발생:", error);
    return [];
  }
}

async function saveTodos(todosToSave) {
  try {
    await fs.writeFile(
      todosFilePath,
      JSON.stringify(todosToSave, null, 2),
      "utf8"
    );
    console.log("[Todo] 할 일 목록이 성공적으로 저장되었습니다.");
    console.log(`\n`)
  } catch (error) {
    console.error("[Todo] 할 일 목록을 저장하는 중 오류 발생:", error);
    console.log(`\n`)
  }
}

// ----------------------------------------------------
// [1] GET /api/todos: 모든 할 일 조회 (JSON 응답)
// ----------------------------------------------------
app.get("/api/todos", async (req, res) => {
  console.log("GET /api/todos 요청 수신");
  const { completed, sort, search } = req.query;
  let todos = await loadTodos();

  console.log("요청 쿼리:", req.query);
  console.log(`\n`)
  //검색 필터링
  if (search) {
    todos = todos.filter(todo =>
      todo.text.toLowerCase().includes(search.toLowerCase())
    );
  }

  //완료상태
  if (completed === "true") {
    todos = todos.filter(todo => todo.completed === true);
  } else if (completed === "false") {
    todos = todos.filter(todo => todo.completed === false);
  }

  //정렬
  if (sort === "asc") {
    todos.sort((a,b) => a.id-b.id); //오래된
  } else if (sort === "desc") {
    todos.sort((a,b) => b.id-a.id); //최신
  } else if (sort === "alpha") {
    todos.sort((a,b) => a.text.localeCompare(b.text)); //알파벳
  }else if (sort === "due") {
    todos.sort((a,b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate)-new Date(b.dueDate); //기한 빠름
    });
  }

  res.json(todos); // 할 일 목록을 JSON 형태로 응답
});

// ----------------------------------------------------
// [2] POST /api/todos: 새로운 할 일 추가 (JSON 요청/응답)
// ----------------------------------------------------
const validateTodoInput = require('./middlewares/validateTodoInput');
app.post("/api/todos",validateTodoInput, async (req, res) => {
  const { text, dueDate } = req.body;
  console.log(
    `POST /api/todos 요청 수신. 할 일: "${text}", 기한: "${dueDate}"`
  );

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "할 일 내용이 비어있습니다." });
  }

  const todos = await loadTodos();
  let maxId = 0;
  // 현재 할 일 목록에서 가장 큰 ID를 찾습니다.
  if (todos.length > 0) {
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id > maxId) {
        maxId = todos[i].id;
      }
    }
  }

  const newId = maxId + 1; // 가장 큰 ID + 1

  const newTodo = {
    id: newId,
    text: text.trim(),
    completed: false,
    dueDate: dueDate || null,
  };
  todos.push(newTodo);
  await saveTodos(todos);

  res.status(201).json(newTodo);
});

// 할일 삭제
app.delete("/api/todos/:id", async (req, res) => {
  const idToDelete = parseInt(req.params.id);
  console.log(`DELETE-삭제할 ID: ${idToDelete}`);
  if (isNaN(idToDelete)) {
    return res.status(400).json({ error: "잘못된 ID입니다." });
  }

  let todos = await loadTodos();
  const filteredTodos = todos.filter((todo) => todo.id !== idToDelete);

  if (filteredTodos.length === todos.length) {
    return res
      .status(404)
      .json({ error: "해당 ID의 할 일을 찾을 수 없습니다." });
  }

  console.log(`\n`)
  await saveTodos(filteredTodos);
  res.status(204).end();
});

// 미완료 및 완료 상태
// 텍스트 수정 통합 핸들러
app.patch("/api/todos/:id", validateTodoInput,async (req, res) => {
  const id = parseInt(req.params.id);
  const { text, completed, dueDate } = req.body;
  console.log(`PATCH-수정 ID: ${id}`);
  console.log("요청 바디:", req.body);

  if (isNaN(id)) {
    return res.status(400).json({ error: "잘못된 ID입니다." });
  }

  const todos = await loadTodos();
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res
      .status(404)
      .json({ error: "해당 ID의 할 일을 찾을 수 없습니다." });
  }

  if (typeof text !=="undefined") {
    todo.text = text.trim();
    console.log(`텍스트 수정: ${todo.text}`);
  }

  if (typeof completed !=="undefined") {
    todo.completed = completed;
    console.log(`완료 상태 수정: ${todo.completed}`);
  }

  //기한수정추가
  if (typeof dueDate !=="undefined") {
    todo.dueDate = dueDate || null;
    console.log(`기한 수정: ${todo.dueDate}`);
  }

  console.log(`\n`)
  await saveTodos(todos);
  res.json(todo);
});

// app.get('/', (req, res) => {
//     // 클라이언트에게 "Hello, Express.js!"라는 텍스트 응답을 보냅니다.
//     res.send('<h1>미들웨어에서 직접 순서대로 확인해서 주소 검사</h1>');
// });

// ----------------------------------------------------
// [3] 정적 파일 제공 (public 폴더)
// ----------------------------------------------------
app.use(express.static(path.join(__dirname, "public")));

// ----------------------------------------------------
// [4] 서버 시작
// ----------------------------------------------------
async function startServer() {
  await loadTodos();
  app.listen(port, () => {
    console.log(
      `To-Do List v3 서버가 http://localhost:${port} 에서 실행 중입니다.`
    );
    console.log(`API 엔드포인트: /api/todos (GET, POST)`);
  });
}

startServer();
