// public/script.js - 클라이언트 사이드 JavaScript

document.addEventListener("DOMContentLoaded", () => {
  const todoList = document.getElementById("todoList");
  const addTodoForm = document.getElementById("addTodoForm");
  const newTodoText = document.getElementById("newTodoText");

  //선택부분
  const sortOrderSelect = document.getElementById("sortOrder");
  sortOrderSelect.addEventListener("change", renderTodos);

  //간단 검색
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", renderTodos);

  //기한 설정
  const dueDateInput = document.getElementById("dueDateInput");

  //에러
  const errorBox = document.getElementById("errorMessage");

  //상태 선택 버튼
  const filterAllBtn = document.getElementById("filterAll");
  const filterCompletedBtn = document.getElementById("filterCompleted");
  const filterIncompleteBtn = document.getElementById("filterIncomplete");
  const filterButtons = [filterAllBtn, filterCompletedBtn, filterIncompleteBtn];
  let currentFilter = "all";

  function updateSelectedButton(selectedBtn) {
    filterButtons.forEach((btn) => {
      btn.classList.remove("selected");
    });
    selectedBtn.classList.add("selected");
  }

  filterAllBtn.addEventListener("click", () => {
    currentFilter = "all";
    updateSelectedButton(filterAllBtn);
    renderTodos();
  });

  filterCompletedBtn.addEventListener("click", () => {
    currentFilter = "completed";
    updateSelectedButton(filterCompletedBtn);
    renderTodos();
  });

  filterIncompleteBtn.addEventListener("click", () => {
    currentFilter = "incomplete";
    updateSelectedButton(filterIncompleteBtn);
    renderTodos();
  });

  // --- 할 일 목록을 화면에 그리는 함수 ---
  async function renderTodos() {
    // 1. 비동기 작업을 위한 try-catch 블록
    try {
      // 2. 서버에서 할 일 목록 가져오기 (GET 요청)
      const response = await fetch("/api/todos"); // 서버의 '/api/todos' 엔드포인트에 GET 요청을 보냅니다.
      // 'await' 키워드는 fetch 요청이 완료되고 응답을 받을 때까지 기다리라는 의미입니다.

      // 3. HTTP 응답 상태 확인
      if (!response.ok) {
        // response.ok는 HTTP 상태 코드가 200번대(성공)이면 true, 아니면 false입니다.
        // 4. 오류 발생 시 예외 발생
        throw new Error(`HTTP error! status: ${response.status}`); // 200 OK가 아니면 에러를 던져 catch 블록으로 이동시킵니다.
      }

      // 5. JSON 응답 파싱
      let todos = await response.json(); // 서버에서 받은 응답(response)을 JSON 형식으로 파싱합니다.
      // 이 또한 비동기 작업이므로 'await'이 필요합니다.

      //상태 변경 버튼 적용
      if (currentFilter === "completed") {
        todos = todos.filter((todo) => todo.completed === true);
      } else if (currentFilter === "incomplete") {
        todos = todos.filter((todo) => todo.completed === false);
      }
      console.log("필터 적용 후 todos:", todos);

      // 6. 기존 할 일 목록 UI 초기화
      todoList.innerHTML = ""; // HTML의 id="todoList"인 <ul> 요소의 내용을 모두 지웁니다.
      // 새로운 목록으로 덮어씌우기 위함입니다.

      // 7. 할 일이 없는 경우 메시지 표시
      if (todos.length === 0) {
        // 서버에서 받은 할 일 목록(todos 배열)이 비어있으면
        todoList.innerHTML =
          '<p style="text-align: center; color: #666;">아직 할 일이 없습니다! 새로운 할 일을 추가해보세요.</p>';
        return; // 함수 실행을 여기서 종료합니다.
      }

      //검색어
      const searchkeyword = searchInput.value.trim().toLowerCase();
      if (searchkeyword !== "") {
        todos = todos.filter((todo) =>
          todo.text.toLowerCase().includes(searchkeyword)
        );
      }

      //정렬
      const sortOrder = sortOrderSelect.value;
      if (sortOrder === "asc") {
        todos.sort((a, b) => a.id - b.id); //오래된
      } else if (sortOrder === "desc") {
        todos.sort((a, b) => b.id - a.id); //최신
      } else if (sortOrder === "alpha") {
        todos.sort((a, b) => a.text.localeCompare(b.text)); //알파벳
      }

      // 8. 할 일 목록을 순회하며 각 항목 렌더링
      todos.forEach((todo) => {
        // todos 배열의 각 'todo' 객체에 대해 다음 코드를 실행합니다.

        // 9. <li> 요소 생성
        const li = document.createElement("li"); // 새로운 <li> HTML 요소를 만듭니다.
        li.dataset.id = todo.id; // 'data-id'라는 사용자 정의 데이터 속성에 할 일의 ID를 저장합니다.
        // 나중에 이 할 일을 삭제하거나 수정할 때 ID를 쉽게 찾아 서버에 전달하기 위함입니다.

        //날짜 비교
        function isOverdue(dueDateStr) {
          if (!dueDateStr) return false;
          const today = new Date();
          const due = new Date(dueDateStr);
          //안지남 = true
          return due < today.setHours(0, 0, 0, 0); //날짜만 비교
        }

        // ✅ 체크박스
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.completed;
        checkbox.addEventListener("change", async () => {
          const newCompleted = checkbox.checked;

          try {
            const res = await fetch(`/api/todos/${todo.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ completed: newCompleted }),
            });

            if (!res.ok) {
              throw new Error("서버 업데이트 실패");
            }

            // ✅ UI 반영 (텍스트 스타일 변경)
            if (newCompleted) {
              textSpan.style.textDecoration = "line-through";
              textSpan.style.color = "#999";
              checkbox.style.accentColor = "#999";
              li.style.backgroundColor = "#d1f4f2";
            } else {
              textSpan.style.textDecoration = "none";
              textSpan.style.color = "#000";
              li.style.backgroundColor = "#f9f9f9";
            }

            console.log(`✔️ 완료 상태 업데이트됨 (ID: ${todo.id})`);
          } catch (err) {
            console.error("완료 상태 업데이트 실패:", err);
            alert("완료 상태 변경에 실패했습니다.");
            checkbox.checked = !newCompleted; // 실패 시 원래 상태로 롤백
          }
        });

        // ✅ 텍스트 (span)
        const textSpan = document.createElement("span");
        textSpan.textContent = todo.text;
        if (todo.completed) {
          textSpan.style.textDecoration = "line-through";
          textSpan.style.color = "#999";
          checkbox.style.accentColor = "#999";
          li.style.backgroundColor = "#d1f4f2";
        }

        //날짜 포멧
        function formatDate(dateStr) {
          if (!dateStr) return "기한 없음";
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = date.getMonth() + 1;
          const day = date.getDate();

          return `${year}년 ${month}월 ${day}일`;
        }

        const isOver = isOverdue(todo.dueDate); //기한 판단
        const dateColor = isOver ? "crimson" : "#666";
        const label = isOver ? "기한 지남: " : "기한: ";

        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";

        // ✅ 수정 버튼
        const editButton = document.createElement("button");
        editButton.textContent = "수정";
        editButton.style.marginLeft = "8px";
        editButton.style.backgroundColor = "black";
        editButton.style.border = "none";
        editButton.style.padding = "3px 7px";
        editButton.style.borderRadius = "4px";
        editButton.style.color = "white";
        editButton.addEventListener("click", () => {
          // 기존 요소들 제거
          const input = document.createElement("input");
          input.type = "text";
          input.value = todo.text;
          input.style.flexGrow = "1";
          input.style.padding = "5px";
          input.style.marginRight = "8px";

          const saveButton = document.createElement("button");
          saveButton.textContent = "저장";
          saveButton.style.backgroundColor = "green";
          saveButton.style.color = "white";
          saveButton.style.border = "none";
          saveButton.style.padding = "3px 7px";
          saveButton.style.borderRadius = "4px";
          li.innerHTML = "";
          li.appendChild(input);
          li.appendChild(saveButton);

          saveButton.addEventListener("click", async () => {
            const newText = input.value.trim();
            if (!newText) {
              alert("내용을 입력하세요!");
              return;
            }

            try {
              const res = await fetch(`/api/todos/${todo.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ text: newText }),
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "수정 실패");
              }

              console.log(`✅ 수정 완료: ${newText}`);
              renderTodos(); // 다시 렌더링
            } catch (error) {
              console.error("수정 중 오류:", error);
              alert("수정 중 오류가 발생했습니다.");
            }
          });
        });

        // ✅ 삭제 버튼
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "삭제";
        deleteButton.style.marginLeft = "8px";
        deleteButton.style.backgroundColor = "red";
        deleteButton.style.border = "none";
        deleteButton.style.padding = "3px 7px";
        deleteButton.style.borderRadius = "4px";
        deleteButton.style.color = "white";
        deleteButton.addEventListener("click", async () => {
          try {
            const res = await fetch(`/api/todos/${todo.id}`, {
              method: "DELETE",
            });
            if (res.ok) {
              li.remove();
              console.log(`🗑️ ID ${todo.id} 삭제 성공`);
            } else {
              alert("삭제 실패");
            }
          } catch (err) {
            console.error("삭제 중 오류:", err);
          }
        });

        li.appendChild(checkbox);
        li.appendChild(textSpan);
        li.appendChild(editButton);
        li.appendChild(deleteButton);

        // // 10. <li> 내부 HTML 설정 (템플릿 리터럴 사용) - 할 일 텍스트를 표시합니다.
        // li.innerHTML = `<span>${todo.text}</span>
        // <span style="color: ${dateColor}; font-size: 0.85em;">
        // (${label}${formatDate(todo.dueDate)})
        // </span>`;

        // 11. 생성된 <li> 요소를 <ul>에 추가
        todoList.appendChild(li); // 모든 설정이 완료된 <li> 요소를 id="todoList"인 <ul> 요소의 자식으로 추가합니다.
      });
    } catch (error) {
      // 12. 전체 fetch 작업 실패 시 에러 처리
      errorBox.textContent = `목록 불러오기 실패: ${error.message}`;
      //   console.error("할 일 목록을 불러오는 데 실패했습니다:", error);
      //   todoList.innerHTML =
      //     '<p style="color: red; text-align: center;">할 일 목록을 불러올 수 없습니다. 서버를 확인해주세요.</p>';
    }
  }

  // --- 할 일 추가 폼 제출 처리 ---
  addTodoForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침) 막기

    //기한 설정 부분
    const dueDate = dueDateInput.value;

    const text = newTodoText.value.trim();
    if (!text) {
      alert("할 일 내용을 입력해주세요!");
      return;
    }

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text, dueDate: dueDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const newTodo = await response.json();
      console.log("새 할 일 추가 성공:", newTodo);

      newTodoText.value = ""; // 입력 필드 초기화
      dueDateInput.value = "";
      renderTodos(); // 할 일 목록 다시 그려서 업데이트된 내용 보여주기
    } catch (error) {
      errorBox.textContent = `할 일 추가 실패: ${error.message}`;
      //   console.error("할 일 추가 실패:", error);
      //   alert(`할 일 추가에 실패했습니다: ${error.message}`);
    }
  });

  // --- 페이지 로드 시 할 일 목록 불러오기 ---
  renderTodos();
});
