backend-часть для тестового задания "Схема рабочего процесса"

Компания ИНФОЦЕХ

Версии, на которых запускался пакет:
- node -v
    v24.12.0 
- tsc -v
    Version 4.8.4

Запуск:
- npm i
- npm run dev

Сваггер:
- http://localhost:3000/swagger

Данные хранятся в виде json-файлов в папке "data"
Рабочий процесс для примера называется wf1, его файл wf1.json

Методы:
/workflow/get - получение данных процесса
/workflow/changeStepXY - изменение координат шага
/workflow/changeStepName - изменение названия шага
/workflow/createStep - создание шага
/workflow/deleteStep - удаление шага