const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const { Product, Cart } = require('./models');
const app = express();
const port = process.env.PORT || 8081;
const cors = require('cors');

// GraphQL schema
const schema = buildSchema(`
    type Product {
        id: ID!
        name: String!
        price: Float!
        image: String!
    }

    type Cart {
        id: ID!
        productId: ID!
        quantity: Int!
        product: Product!
    }

    type Query {
        products: [Product]
        cart: [Cart]
    }

    type Mutation {
        addProduct(name: String!, price: Float!, image: String!): Product
        addToCart(productId: ID!, quantity: Int!): Cart
        removeFromCart(cartId: ID!): Cart
    }
`);

// Root resolver
const root = {
    products: async () => await Product.findAll(),
    cart: async () => {
        const cartItems = await Cart.findAll();
        const populatedCart = await Promise.all(cartItems.map(async (cartItem) => {
            const product = await Product.findByPk(cartItem.productId);
            return {
                id: cartItem.id,
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image
                }
            };
        }));
        return populatedCart;
    },
    addProduct: async ({ name, price, image }) => {
        const product = await Product.create({ name, price, image });
        return product;
    },
    addToCart: async ({ productId, quantity }) => {
        const cart = await Cart.create({ productId, quantity });
        return cart;
    },
    removeFromCart: async ({ cartId }) => {
        const cartItem = await Cart.findByPk(cartId);
        if (cartItem) {
            await cartItem.destroy();
            return cartItem;
        } else {
            throw new Error('Cart item not found');
        }
    }
};
app.use(cors({
    credentials: true
}))

app.use('/graphql', graphqlHTTP((req)=> ({
    schema: schema,
    rootValue: root,
    graphiql: true,
    context: { req }
})));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/graphql`);
});
