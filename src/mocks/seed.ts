import type { DemoData, Appointment } from "../types/domain.ts";
import { addDays } from "../lib/format.ts";

export function createSeed(referenceDate: string): DemoData {
  const tenants = [
    {
      id: "studio",
      name: "Studio Aurora",
      segment: "Barbearia & bem-estar",
      address: "Rua das Flores, 120 · Centro",
      city: "São Paulo, SP",
      phone: "(11) 99999-0100",
      open: "09:00",
      close: "19:00",
      weekdays: [1, 2, 3, 4, 5, 6],
    },
    {
      id: "jardins",
      name: "Aurora Jardins",
      segment: "Salão & estética",
      address: "Alameda Jardim, 85 · Jardins",
      city: "São Paulo, SP",
      phone: "(11) 99999-0200",
      open: "10:00",
      close: "18:00",
      weekdays: [1, 2, 3, 4, 5, 6],
    },
  ];
  const services = [
    {
      id: "cut",
      tenantId: "studio",
      name: "Corte de cabelo",
      description: "Seu estilo, com acabamento e cuidado em cada detalhe.",
      category: "Cabelo",
      duration: 30,
      price: 55,
      active: true,
    },
    {
      id: "beard",
      tenantId: "studio",
      name: "Barba & cuidado",
      description: "Modelagem, toalha quente e finalização.",
      category: "Barba",
      duration: 30,
      price: 40,
      active: true,
    },
    {
      id: "combo",
      tenantId: "studio",
      name: "Corte + barba",
      description: "O cuidado completo para renovar o visual.",
      category: "Combos",
      duration: 60,
      price: 85,
      active: true,
    },
    {
      id: "brow",
      tenantId: "studio",
      name: "Design de sobrancelhas",
      description: "Um desenho que respeita a sua expressão.",
      category: "Estética",
      duration: 30,
      price: 30,
      active: true,
    },
    {
      id: "hair",
      tenantId: "jardins",
      name: "Corte & finalização",
      description: "Um novo corte com finalização personalizada.",
      category: "Cabelo",
      duration: 60,
      price: 120,
      active: true,
    },
    {
      id: "skin",
      tenantId: "jardins",
      name: "Limpeza de pele",
      description: "Um momento de cuidado para a sua pele.",
      category: "Estética",
      duration: 60,
      price: 150,
      active: true,
    },
  ];
  const professionals = [
    {
      id: "leo",
      tenantId: "studio",
      name: "Leonardo Silva",
      specialty: "Cortes clássicos & barba",
      initials: "LS",
      color: "purple" as const,
      serviceIds: ["cut", "beard", "combo"],
      active: true,
    },
    {
      id: "bia",
      tenantId: "studio",
      name: "Beatriz Costa",
      specialty: "Cabelo & visagismo",
      initials: "BC",
      color: "peach" as const,
      serviceIds: ["cut", "combo", "brow"],
      active: true,
    },
    {
      id: "rafa",
      tenantId: "studio",
      name: "Rafael Lima",
      specialty: "Cortes modernos & barba",
      initials: "RL",
      color: "blue" as const,
      serviceIds: ["cut", "beard", "combo", "brow"],
      active: true,
    },
    {
      id: "ana",
      tenantId: "jardins",
      name: "Ana Oliveira",
      specialty: "Cabelo & estética",
      initials: "AO",
      color: "purple" as const,
      serviceIds: ["hair", "skin"],
      active: true,
    },
  ];
  const customers = [
    [
      "c1",
      "Lucas Martins",
      "11900000101",
      "lucas@example.com",
      "Prefere atendimento pela manhã.",
    ],
    ["c2", "Pedro Almeida", "11900000102", "pedro@example.com", ""],
    ["c3", "Mariana Santos", "11900000103", "mariana@example.com", ""],
    ["c4", "Gabriel Rocha", "11900000104", "gabriel@example.com", ""],
    ["c5", "Felipe Oliveira", "11900000105", "felipe@example.com", ""],
    ["c6", "Camila Souza", "11900000106", "camila@example.com", ""],
    ["c7", "Bruno Ferreira", "11900000107", "bruno@example.com", ""],
    ["c8", "Juliana Ribeiro", "11900000108", "juliana@example.com", ""],
  ].map(([id, name, phone, email, notes]) => ({
    id,
    tenantId: "studio",
    name,
    phone,
    email,
    notes,
  }));
  const appointments: Appointment[] = [];
  for (let day = -27; day <= 3; day++) {
    const date = addDays(referenceDate, day);
    if (
      !tenants[0].weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())
    )
      continue;
    for (let index = 0; index < 8; index++) {
      const service = services[index % 4];
      const professionalId = ["leo", "bia", "rafa"][index % 3];
      const serviceId =
        professionalId === "leo" && service.id === "brow"
          ? "beard"
          : professionalId === "bia" && service.id === "beard"
            ? "cut"
            : service.id;
      const selected = services.find((item) => item.id === serviceId)!;
      const statuses = [
        "confirmed",
        "confirmed",
        "scheduled",
        "confirmed",
        "scheduled",
        "confirmed",
        "canceled",
        "confirmed",
      ] as const;
      appointments.push({
        id: `seed-${day}-${index}`,
        tenantId: "studio",
        customerId: `c${index + 1}`,
        professionalId,
        serviceId,
        date,
        time: [
          "09:00",
          "09:30",
          "10:00",
          "11:00",
          "13:00",
          "14:00",
          "15:00",
          "16:30",
        ][index],
        duration: selected.duration,
        price: selected.price,
        status:
          day < 0
            ? index === 6 && day % 3 === 0
              ? "no_show"
              : index === 6
                ? "canceled"
                : "completed"
            : statuses[index],
        source: index % 2 ? "online" : "manual",
        recovered: index === 5 && day % 2 === 0,
      });
    }
  }
  return {
    version: 1,
    referenceDate,
    tenants,
    services,
    professionals,
    customers,
    appointments,
    waitlist: [
      {
        id: "w1",
        tenantId: "studio",
        customerId: "c7",
        serviceId: "combo",
        professionalId: "leo",
        date: addDays(referenceDate, 1),
        preference: "afternoon",
        status: "waiting",
      },
      {
        id: "w2",
        tenantId: "studio",
        customerId: "c8",
        serviceId: "brow",
        professionalId: "bia",
        date: addDays(referenceDate, 1),
        preference: "morning",
        status: "waiting",
      },
      {
        id: "w3",
        tenantId: "studio",
        customerId: "c5",
        serviceId: "cut",
        professionalId: "",
        date: addDays(referenceDate, 2),
        preference: "any",
        status: "contacted",
      },
    ],
    expenses: [
      {
        id: "e1",
        tenantId: "studio",
        title: "Produtos e materiais",
        category: "Insumos",
        amount: 280,
        date: addDays(referenceDate, -2),
      },
      {
        id: "e2",
        tenantId: "studio",
        title: "Aluguel do espaço",
        category: "Estrutura",
        amount: 1800,
        date: referenceDate.slice(0, 8) + "01",
      },
      {
        id: "e3",
        tenantId: "studio",
        title: "Café e recepção",
        category: "Operação",
        amount: 95,
        date: referenceDate,
      },
    ],
    session: null,
    lastBookingId: null,
  };
}
