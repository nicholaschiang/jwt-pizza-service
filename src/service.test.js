const request = require("supertest");
const app = require("./service");
const { Role, DB } = require("./database/database.js");

const testUser = {
  name: "pizza diner",
  email: "reg@test.com",
  password: "a",
  roles: [{ role: Role.Admin }],
};
let testUserAuthToken;

// Clear the database and seed the test user before each test.
beforeEach(async () => {
  await DB.dropDatabase();
  DB.initialized = DB.initializeDatabase();
  testUser.email = Math.random().toString(36).substring(2, 12) + "@test.com";
  testUser.id = (await DB.addUser(testUser)).id;
  testUser.password = "a";
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  testUserAuthToken = loginRes.body.token;
});

test("everything", async () => {
  let res = await request(app).get("/api/franchise");
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject([]);

  res = await request(app).get(`/api/franchise/${testUser.id}`);
  expect(res.status).toBe(401);

  res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject([]);

  let franchise = {
    name: "pizzaPocket",
    admins: [{ email: testUser.email }],
  };

  res = await request(app).post("/api/franchise").send(franchise);
  expect(res.status).toBe(401);

  res = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(franchise);
  expect(res.status).toBe(200);
  expect(res.body.id).toBeDefined();
  expect(res.body.name).toBe(franchise.name);
  franchise = res.body;

  let store = {
    franchiseId: franchise.id,
    name: "SLC",
  };

  res = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(store);
  expect(res.status).toBe(200);
  expect(res.body.id).toBeDefined();
  store = res.body;

  res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject([franchise]);

  // CREATE AN ORDER
  res = await request(app).get("/api/order/menu");
  expect(res.status).toBe(200);

  let item = {
    title: "Student",
    description: "No topping, no sauce, just carbs",
    image: "pizza9.png",
    price: 0.0001,
  };
  res = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(item);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject([item]);
  item = res.body[0];

  res = await request(app)
    .get("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({ dinerId: testUser.id, orders: [], page: 1 });

  res = await request(app).post("/api/order");
  expect(res.status).toBe(401);

  let order = {
    franchiseId: franchise.id,
    storeId: store.id,
    items: [{ menuId: 1, description: "Veggie", price: 0.05 }],
  };

  res = await request(app)
    .post("/api/order")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(order);
  expect(res.status).toBe(200);

  // DELETE EVERYTHING
  res = await request(app)
    .delete(`/api/franchise/${franchise.id}/store/${store.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);

  res = await request(app).delete(`/api/franchise/${franchise.id}`);
  expect(res.status).toBe(401);

  res = await request(app)
    .delete(`/api/franchise/${franchise.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);

  res = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`);
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject([]);
});
