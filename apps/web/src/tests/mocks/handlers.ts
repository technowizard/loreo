import { HttpResponse, http } from 'msw';

type Task = {
  id: string;
  name: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

const API_URL = 'http://localhost:3000';

export const defaultTasks: Task[] = [
  {
    id: '1',
    name: 'buy groceries',
    completed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'fix bug',
    completed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: 'write tests',
    completed: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const handlers = [
  http.get(`${API_URL}/tasks`, () => {
    return HttpResponse.json({
      result: defaultTasks,
      message: 'ok',
      status: 200
    });
  }),

  http.post(`${API_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      completed?: boolean;
    };
    const created: Task = {
      id: crypto.randomUUID(),
      name: body.name,
      completed: body.completed ?? false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return HttpResponse.json({ result: created, message: 'created', status: 201 }, { status: 201 });
  }),

  http.patch(`${API_URL}/tasks/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Partial<Task>;
    const task = defaultTasks.find((t) => t.id === params.id) ?? defaultTasks[0]!;
    const updated: Task = {
      ...task,
      ...body,
      updatedAt: new Date().toISOString()
    };
    return HttpResponse.json({ result: updated, message: 'ok', status: 200 });
  }),

  http.delete(`${API_URL}/tasks/:id`, ({ params }) => {
    return HttpResponse.json({
      result: { id: params.id },
      message: 'deleted',
      status: 200
    });
  })
];
