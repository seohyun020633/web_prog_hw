// public/script.js - 클라이언트 사이드 JavaScript

document.addEventListener('DOMContentLoaded', () => {
    const todoList = document.getElementById('todoList');
    const addTodoForm = document.getElementById('addTodoForm');
    const newTodoText = document.getElementById('newTodoText');

    // --- 할 일 목록을 화면에 그리는 함수 ---
    async function renderTodos() {
        // 1. 비동기 작업을 위한 try-catch 블록
        try {
            // 2. 서버에서 할 일 목록 가져오기 (GET 요청)
            const response = await fetch('/api/todos'); // 서버의 '/api/todos' 엔드포인트에 GET 요청을 보냅니다.
            // 'await' 키워드는 fetch 요청이 완료되고 응답을 받을 때까지 기다리라는 의미입니다.

            // 3. HTTP 응답 상태 확인
            if (!response.ok) { // response.ok는 HTTP 상태 코드가 200번대(성공)이면 true, 아니면 false입니다.
                // 4. 오류 발생 시 예외 발생
                throw new Error(`HTTP error! status: ${response.status}`); // 200 OK가 아니면 에러를 던져 catch 블록으로 이동시킵니다.
            }

            // 5. JSON 응답 파싱
            const todos = await response.json(); // 서버에서 받은 응답(response)을 JSON 형식으로 파싱합니다.
            // 이 또한 비동기 작업이므로 'await'이 필요합니다.

            // 6. 기존 할 일 목록 UI 초기화
            todoList.innerHTML = ''; // HTML의 id="todoList"인 <ul> 요소의 내용을 모두 지웁니다.
            // 새로운 목록으로 덮어씌우기 위함입니다.

            // 7. 할 일이 없는 경우 메시지 표시
            if (todos.length === 0) { // 서버에서 받은 할 일 목록(todos 배열)이 비어있으면
                todoList.innerHTML = '<p style="text-align: center; color: #666;">아직 할 일이 없습니다! 새로운 할 일을 추가해보세요.</p>';
                return; // 함수 실행을 여기서 종료합니다.
            }

            // 8. 할 일 목록을 순회하며 각 항목 렌더링
            todos.forEach(todo => { // todos 배열의 각 'todo' 객체에 대해 다음 코드를 실행합니다.
                // 9. <li> 요소 생성
                const li = document.createElement('li'); // 새로운 <li> HTML 요소를 만듭니다.
                li.dataset.id = todo.id; // 'data-id'라는 사용자 정의 데이터 속성에 할 일의 ID를 저장합니다.
                // 나중에 이 할 일을 삭제하거나 수정할 때 ID를 쉽게 찾아 서버에 전달하기 위함입니다.


                // 10. <li> 내부 HTML 설정 (템플릿 리터럴 사용) - 할 일 텍스트를 표시합니다.
                li.innerHTML = `<span>${todo.text}</span>`;

                // 11. 생성된 <li> 요소를 <ul>에 추가
                todoList.appendChild(li); // 모든 설정이 완료된 <li> 요소를 id="todoList"인 <ul> 요소의 자식으로 추가합니다.
            });
        } catch (error) {
            // 12. 전체 fetch 작업 실패 시 에러 처리
            console.error('할 일 목록을 불러오는 데 실패했습니다:', error);
            todoList.innerHTML = '<p style="color: red; text-align: center;">할 일 목록을 불러올 수 없습니다. 서버를 확인해주세요.</p>';
        }
    }

    // --- 할 일 추가 폼 제출 처리 ---
    addTodoForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 폼의 기본 제출 동작(페이지 새로고침) 막기

        const text = newTodoText.value.trim();
        if (!text) {
            alert('할 일 내용을 입력해주세요!');
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const newTodo = await response.json();
            console.log('새 할 일 추가 성공:', newTodo);

            newTodoText.value = ''; // 입력 필드 초기화
            renderTodos(); // 할 일 목록 다시 그려서 업데이트된 내용 보여주기

        } catch (error) {
            console.error('할 일 추가 실패:', error);
            alert(`할 일 추가에 실패했습니다: ${error.message}`);
        }
    });

    // --- 페이지 로드 시 할 일 목록 불러오기 ---
    renderTodos();
});