/// <reference types="cypress" />

// Сквозной тест собранного через single-spa приложения:
// таблица (Vue) и диаграмма (React) на одной странице, связь через шину событий.
describe('Редактор схемы рабочего процесса', () => {
  beforeEach(() => {
    cy.visit('/');
    // Дожидаемся, пока оба микрофронта смонтируются и отрисуют данные.
    cy.get('[data-cy=row]', { timeout: 20000 }).should('have.length.greaterThan', 5);
    cy.get('[data-cy=block]', { timeout: 20000 }).should('have.length.greaterThan', 5);
  });

  it('рисует одинаковое число состояний в таблице и на диаграмме', () => {
    cy.get('[data-cy=block]').then(($blocks) => {
      cy.get('[data-cy=row]').should('have.length', $blocks.length);
    });
  });

  it('выбор строки подсвечивает блок на диаграмме', () => {
    cy.get('[data-cy=row]').first().click();
    cy.get('[data-cy=row]').first().should('have.attr', 'data-selected', 'true');
    cy.get('[data-cy=block][data-selected=true]').should('have.length', 1);
  });

  it('выбор блока подсвечивает строку в таблице', () => {
    cy.get('[data-cy=block]')
      .eq(2)
      .click()
      .invoke('attr', 'data-index')
      .then((idx) => {
        cy.get(`[data-cy=row][data-row="${idx}"]`).should('have.attr', 'data-selected', 'true');
      });
  });

  it('фильтрует строки по поиску', () => {
    cy.get('[data-cy=search]').type('Сортировка');
    cy.get('[data-cy=row] [data-cy=name]').each(($el) => {
      expect($el.text().toLowerCase()).to.contain('сортировка');
    });
  });

  it('создаёт новое состояние и затем удаляет его (очистка данных)', () => {
    cy.get('[data-cy=row]')
      .its('length')
      .then((before) => {
        cy.get('[data-cy=create-step]').click();
        cy.get('[data-cy=row]').should('have.length', before + 1);
        // Удаляем созданную строку — из UI пропадает сразу.
        cy.get('[data-cy=row]').last().find('[data-cy=delete]').click();
        cy.get('[data-cy=row]').should('have.length', before);
        // Удаление на сервер уходит через окно отмены — ждём и проверяем, что данные чисты.
        cy.wait(5600);
        cy.request('http://127.0.0.1:4000/workflow/get?wfName=wf1').then((res) => {
          expect(res.body.steps).to.have.length(before);
        });
      });
  });

  it('Undo возвращает удалённое состояние (тост «Отменить»)', () => {
    cy.get('[data-cy=row]')
      .its('length')
      .then((before) => {
        cy.get('[data-cy=create-step]').click();
        cy.get('[data-cy=row]').should('have.length', before + 1);
        cy.get('[data-cy=row]').last().find('[data-cy=delete]').click();
        cy.get('[data-cy=row]').should('have.length', before);
        // Появляется тост — жмём «Отменить», строка возвращается.
        cy.get('[data-cy=undo-toast]').should('be.visible');
        cy.get('[data-cy=undo]').click();
        cy.get('[data-cy=row]').should('have.length', before + 1);
        // Чистим: удаляем снова и ждём коммита на сервер.
        cy.get('[data-cy=row]').last().find('[data-cy=delete]').click();
        cy.wait(5600);
        cy.request('http://127.0.0.1:4000/workflow/get?wfName=wf1').then((res) => {
          expect(res.body.steps).to.have.length(before);
        });
      });
  });

  it('выделение состояния подсвечивает связи и приглушает остальное (req доп.)', () => {
    // Закупка (0) -> Отправка продавцом (2): сосед не приглушён, несвязанный — приглушён.
    cy.get('[data-row="0"]').click();
    cy.get('[data-cy=block][data-index=0]').should('have.attr', 'data-dimmed', 'false');
    cy.get('[data-cy=block][data-index=2]').should('have.attr', 'data-dimmed', 'false');
    cy.get('[data-cy=block][data-index=7]').should('have.attr', 'data-dimmed', 'true');
  });

  it('создаёт состояние с выбранным цветом и сохраняет цвет на сервере', () => {
    const apiUrl = 'http://127.0.0.1:4000';
    cy.get('[data-cy=row]')
      .its('length')
      .then((before) => {
        // выбираем синий в палитре нового состояния
        cy.get('[data-cy="color-#0044aa"]').click();
        cy.get('[data-cy=create-step]').click();
        cy.get('[data-cy=row]').should('have.length', before + 1);

        cy.request(`${apiUrl}/workflow/get?wfName=wf1`).then((res) => {
          const steps = res.body.steps as Array<{ initialIndex: number; color?: string }>;
          const created = steps[steps.length - 1];
          expect(created.color?.toLowerCase()).to.eq('#0044aa');
          // блок на диаграмме получил этот цвет в рамке
          cy.get(`[data-cy=block][data-index="${created.initialIndex}"] > div`).should(
            'have.css',
            'border-top-color',
            'rgb(0, 68, 170)',
          );
          // очистка
          cy.get('[data-cy=row]').last().find('[data-cy=delete]').click();
          cy.get('[data-cy=row]').should('have.length', before);
        });
      });
  });

  it('клавиатура: стрелки навигируют, F2 редактирует, Esc снимает выделение', () => {
    const table = () => cy.get('[data-cy=table]');
    table().focus();
    table().trigger('keydown', { key: 'ArrowDown' });
    cy.get('[data-cy=row]').first().should('have.attr', 'data-selected', 'true');
    table().trigger('keydown', { key: 'ArrowDown' });
    cy.get('[data-cy=row]').eq(1).should('have.attr', 'data-selected', 'true');
    // F2 открывает инлайн-редактирование выбранной строки.
    table().trigger('keydown', { key: 'F2' });
    cy.get('[data-cy=name-input]').should('exist').type('{esc}');
    // Esc снимает выделение.
    table().trigger('keydown', { key: 'Escape' });
    cy.get('[data-cy=row][data-selected=true]').should('have.length', 0);
  });

  it('показывает кнопки управления зумом на диаграмме', () => {
    cy.get('[data-cy=zoom-in]').should('be.visible');
    cy.get('[data-cy=zoom-out]').should('be.visible');
    cy.get('[data-cy=zoom-fit]').should('be.visible').click();
  });

  it('перетаскивание блока обновляет координаты в таблице и сохраняет на сервере', () => {
    const api = 'http://127.0.0.1:4000';
    // Запоминаем исходные координаты шага 0, чтобы вернуть их после теста.
    cy.request(`${api}/workflow/get?wfName=wf1`).then((res) => {
      const original = res.body.steps.find((s: { initialIndex: number }) => s.initialIndex === 0);

      cy.get('[data-cy=block][data-index=0]').then(($b) => {
        const r = $b[0].getBoundingClientRect();
        const startX = r.left + r.width / 2;
        const startY = r.top + r.height / 2;
        cy.get('[data-cy=block][data-index=0]').trigger('mousedown', {
          button: 0,
          clientX: startX,
          clientY: startY,
        });
        cy.get('body')
          .trigger('mousemove', { clientX: startX + 120, clientY: startY + 80 })
          .trigger('mouseup', { clientX: startX + 120, clientY: startY + 80 });
      });

      // Координаты в таблице изменились (колонка x — вторая ячейка строки).
      cy.get('[data-row="0"] td').eq(1).should('not.have.text', String(original.x));

      // И изменение долетело до сервера.
      cy.wait(300);
      cy.request(`${api}/workflow/get?wfName=wf1`).then((res2) => {
        const moved = res2.body.steps.find((s: { initialIndex: number }) => s.initialIndex === 0);
        expect(moved.x !== original.x || moved.y !== original.y).to.be.true;
        // Возвращаем исходные координаты, чтобы не портить демо-данные.
        cy.request('POST', `${api}/workflow/changeStepXY`, {
          wfName: 'wf1',
          stepInitialIndex: 0,
          x: original.x,
          y: original.y,
        });
      });
    });
  });
});
