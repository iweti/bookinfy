import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-05T11:00:00Z") });
});

async function owner(page: Page) {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Explorar como dono(a)", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Tudo em dia/ }),
  ).toBeVisible();
}
async function noOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    )
    .toBe(true);
}

test("site institucional navega e mantém a proposta comercial aprovada", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Sua rotina.*Seu negócio/ }),
  ).toBeVisible();
  await expect(page.getByText("teste grátis", { exact: false })).toHaveCount(0);
  await page
    .getByRole("link", { name: "Soluções", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /As partes da sua rotina/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Planos", exact: true }).first().click();
  await expect(
    page.getByText("Apresentação de recursos. Sem contratação nesta etapa."),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "IWETI", exact: true }),
  ).toHaveAttribute("href", "https://iweti.com");
});

test("cliente agenda, reserva persiste e dono conclui o atendimento", async ({
  page,
}) => {
  await page.goto("/agendar");
  await page.getByRole("button", { name: /Barbearia.*Studio Aurora/ }).click();
  await page.getByRole("button", { name: /Corte \+ barba.*85/ }).click();
  await page
    .getByRole("button", { name: /Leonardo Silva.*Ver horários/ })
    .click();
  await page
    .getByRole("button", {
      name: "sexta-feira, 6 de novembro de 2026",
      exact: true,
    })
    .click();
  await page.getByRole("button", { name: "17:00", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Seu nome", { exact: true }).fill("Cliente Navegável");
  await page.getByLabel("Telefone com DDD").fill("11900000998");
  await page.getByLabel("E-mail (opcional)").fill("demo@example.com");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu momento está reservado!" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Seu momento está reservado!" }),
  ).toBeVisible();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Adicionar ao calendário" }).click();
  const download = await downloadEvent;
  const calendar = await readFile((await download.path())!, "utf8");
  expect(calendar).toContain("DTSTART:20261106T200000Z");
  expect(calendar).toContain("DTEND:20261106T210000Z");
  await owner(page);
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await page.getByLabel("Data da agenda").fill("2026-11-06");
  await page.getByRole("button", { name: /17:00.*Cliente Navegável/ }).click();
  await page.getByRole("button", { name: "Confirmar presença" }).click();
  await page.getByRole("button", { name: "Iniciar atendimento" }).click();
  await page.getByRole("button", { name: "Concluir atendimento" }).click();
  await expect(
    page.getByRole("dialog").getByText("Concluído", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await page.getByLabel("Buscar movimentações").fill("Cliente Navegável");
  await expect(
    page.getByRole("cell", { name: "Concluído", exact: true }),
  ).toBeVisible();
});

test("cadastros persistem, vinculam serviços e respeitam a unidade selecionada", async ({
  page,
}) => {
  await owner(page);
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await page.getByLabel("Nome completo").fill("Pessoa Exemplo");
  await page.getByLabel("Telefone com DDD").fill("11900000997");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await page.getByLabel("Buscar clientes").fill("Pessoa Exemplo");
  await expect(
    page.getByRole("cell").filter({ hasText: "Pessoa Exemplo" }),
  ).toBeVisible();
  await page.reload();
  await page.getByLabel("Buscar clientes").fill("Pessoa Exemplo");
  await expect(
    page.getByRole("cell").filter({ hasText: "Pessoa Exemplo" }),
  ).toBeVisible();
  await page.getByLabel("Unidade do painel").selectOption("jardins");
  await expect(page.getByText("Pessoa Exemplo", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel("Unidade do painel").selectOption("studio");
  await page.getByRole("link", { name: "Serviços", exact: true }).click();
  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByLabel("Nome do serviço").fill("Cuidado de Teste");
  await page.getByLabel("Categoria", { exact: true }).fill("Especial");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Serviço demonstrativo para validação.");
  await page.getByLabel("Duração (minutos)").fill("60");
  await page.getByLabel("Valor (R$)").fill("95");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(
    page.getByRole("heading", { name: "Cuidado de Teste", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Profissionais", exact: true }).click();
  await page.getByRole("button", { name: "Novo profissional" }).click();
  await page.getByLabel("Nome completo").fill("Talento de Teste");
  await page
    .getByLabel("Especialidade", { exact: true })
    .fill("Cuidados personalizados");
  await page.getByLabel("Cuidado de Teste", { exact: true }).check();
  await page.getByRole("button", { name: "Salvar profissional" }).click();
  await expect(
    page.getByRole("heading", { name: "Talento de Teste", exact: true }),
  ).toBeVisible();
  await page.goto("/agendar/servico?unidade=studio");
  await page.getByRole("button", { name: /Cuidado de Teste/ }).click();
  await expect(
    page.getByRole("button", { name: /Talento de Teste/ }),
  ).toBeVisible();
});

test("funcionário acessa apenas sua agenda e atualiza o próprio atendimento", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Sou da equipe" }).click();
  await page.getByLabel("Profissional da demonstração").selectOption("leo");
  await page
    .getByRole("button", { name: "Explorar como funcionário(a)" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Minha agenda", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Financeiro", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("Mariana Santos", { exact: true })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: /09:00.*Lucas Martins/ }).click();
  await expect(
    page.getByRole("button", { name: "Remarcar", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Iniciar atendimento" }).click();
  await page.getByRole("button", { name: "Concluir atendimento" }).click();
  await expect(
    page.getByRole("dialog").getByText("Concluído", { exact: true }),
  ).toBeVisible();
  await page.goto("/app/financeiro");
  await expect(
    page.getByRole("heading", { name: "Um espaço reservado à gestão." }),
  ).toBeVisible();
});

test("financeiro exporta os filtros, lista de espera simula e configurações restauram", async ({
  page,
}) => {
  await owner(page);
  await page.getByRole("link", { name: "Financeiro", exact: true }).click();
  await page.getByRole("button", { name: "Nova despesa" }).click();
  await page.getByLabel("Descrição da despesa").fill("Material de Teste");
  await page.getByLabel("Valor (R$)").fill("42.50");
  await page.getByRole("button", { name: "Salvar despesa" }).click();
  await page.getByLabel("Buscar movimentações").fill("Material de Teste");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const csv = await readFile((await (await downloadEvent).path())!, "utf8");
  expect(csv).toContain("Material de Teste");
  expect(csv).toContain("-42,50");
  expect(csv).not.toContain("Lucas Martins");
  await page.getByRole("link", { name: /Lista de espera/ }).click();
  await page.getByRole("button", { name: "Simular oferta" }).first().click();
  await expect(page.getByRole("status")).toContainText(
    "Nenhuma mensagem foi enviada",
  );
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  await page.getByLabel("Nome do negócio").fill("Negócio de Teste");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(
    page.getByLabel("Unidade do painel").locator("option:checked"),
  ).toHaveText("Negócio de Teste");
  await page.getByRole("button", { name: "Demonstração", exact: true }).click();
  await page.getByRole("button", { name: "Restaurar demonstração" }).click();
  await page
    .getByRole("button", { name: "Restaurar dados de exemplo" })
    .click();
  await expect(
    page.getByLabel("Unidade do painel").locator("option:checked"),
  ).toHaveText("Studio Aurora");
});

test("layout móvel navega sem vazamento horizontal", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("landing-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir menu", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Navegação móvel" })
    .getByRole("link", { name: "Planos", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /Conheça o que faz parte/ }),
  ).toBeVisible();
  await owner(page);
  await noOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Abrir navegação do painel" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Agenda", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Uma agenda que flui." }),
  ).toBeVisible();
  await noOverflow(page);
  await page.goto("/agendar");
  await expect(
    page.getByRole("button", { name: /Studio Aurora/ }),
  ).toBeVisible();
  await noOverflow(page);
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "agenda",
      "clientes",
      "servicos",
      "profissionais",
      "financeiro",
      "lista-espera",
      "configuracoes",
    ]) {
      await page.goto(`/app/${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await noOverflow(page);
    }
  }
});

test("remarcar preserva o atendimento e cancelar libera o horário", async ({
  page,
}) => {
  await owner(page);
  await page.getByRole("link", { name: "Agenda", exact: true }).click();
  await page.getByLabel("Data da agenda").fill("2026-11-06");
  await page.getByRole("button", { name: /11:00.*Gabriel Rocha/ }).click();
  await page.getByRole("button", { name: "Remarcar", exact: true }).click();
  await page.getByLabel("Novo horário").selectOption("17:00");
  await page.getByRole("button", { name: "Salvar remarcação" }).click();
  await page.getByRole("button", { name: /17:00.*Gabriel Rocha/ }).click();
  await page
    .getByRole("button", { name: "Cancelar atendimento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
  await expect(
    page.getByRole("dialog").getByText("Cancelado", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Cancelamentos e faltas · histórico do dia",
    }),
  ).toBeVisible();
  await page.goto(
    "/agendar/data-horario?unidade=studio&servico=beard&profissional=leo&data=2026-11-06",
  );
  await expect(
    page.getByRole("button", { name: "17:00", exact: true }),
  ).toBeVisible();
});

test("links incompletos e armazenamento incompatível têm recuperação visível", async ({
  page,
}) => {
  await page.goto("/agendar/cliente");
  await expect(
    page.getByRole("heading", { name: "Vamos começar do início?" }),
  ).toBeVisible();
  await page.goto(
    "/agendar/cliente?unidade=studio&servico=cut&profissional=leo&data=invalida&horario=99:00",
  );
  await expect(
    page.getByRole("heading", { name: "Vamos começar do início?" }),
  ).toBeVisible();
  await page.goto("/agendar/confirmacao");
  await expect(
    page.getByRole("heading", { name: "Sua confirmação aparece aqui." }),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("bookinfy.demo.v1", '{"version":999}'),
  );
  await page.reload();
  await page.goto("/agendar");
  await expect(
    page.getByRole("button", { name: /Studio Aurora/ }),
  ).toBeVisible();
  await page.goto("/um-caminho-inexistente");
  await expect(
    page.getByRole("heading", { name: "Esse caminho ficou livre." }),
  ).toBeVisible();
});

test("telas representativas passam pela auditoria de acessibilidade", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.screenshot({
    path: testInfo.outputPath("landing-desktop.png"),
    fullPage: true,
  });
  const landing = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    landing.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
  await owner(page);
  await page.screenshot({
    path: testInfo.outputPath("dashboard-desktop.png"),
    fullPage: true,
  });
  const dashboard = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    dashboard.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  ).toEqual([]);
});

test("acesso, agendamento e módulos internos mantêm leitura e semântica acessíveis", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  for (const route of [
    "/login",
    "/cadastro",
    "/recuperar-senha",
    "/agendar",
    "/agendar/servico?unidade=studio",
    "/agendar/profissional?unidade=studio&servico=combo",
    "/agendar/data-horario?unidade=studio&servico=combo&profissional=leo",
    "/agendar/cliente?unidade=studio&servico=combo&profissional=leo&data=2026-11-06&horario=17:00",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect
      .soft(
        result.violations.map((v) => ({
          route,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      )
      .toEqual([]);
  }
  await owner(page);
  for (const route of [
    "agenda",
    "clientes",
    "servicos",
    "profissionais",
    "financeiro",
    "lista-espera",
    "configuracoes",
  ]) {
    await page.goto(`/app/${route}`);
    await expect(page.locator("h1")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect
      .soft(
        result.violations.map((v) => ({
          route,
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      )
      .toEqual([]);
    if (route === "agenda")
      await page.screenshot({
        path: testInfo.outputPath("agenda-desktop.png"),
        fullPage: true,
      });
  }
});
