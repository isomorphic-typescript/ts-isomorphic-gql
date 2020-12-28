/*
type Type = ScalarType | ObjectType;
type ScalarType = IDType | StringType | IntType | Float | BooleanType;
type QueryType = 4;
type SchemaType = 5;
type ObjectType = 2;
type List<T extends Type> = T[]; // Find a way to represent [String!]
*/

// Custom scalar
// Enum type
// Interface & implements
// Inline fragments

type iGQLType<T> = {
    name: string;
    decode: () => T;
}

export const scalar = {
    ID: {
        name: "ID",
        decode(): string {
            return "";
        }
    } as const,
    String: {
        name: "String",
        decode(): string {
            return "";
        }
    } as const,
    Int: {
        name: "Int",
        decode(): number {
            return 6;
        }
    } as const,
    Float: {
        name: "Float",
        decode(): number {
            return 5;
        }
    } as const,
    Boolean: {
        name: "Boolean",
        decode(): boolean {
            return true;
        }
    } as const,
};

type TypeDef = {
    [fieldName: string]: Type;
    // https://github.com/microsoft/TypeScript/issues/1863
    // https://github.com/microsoft/TypeScript/pull/26797
    // Once the above is done we can do the below to ban symbol keys
    // [symbolFieldName: symbol]: never;
}


    object: (definition: () => TypeDef): Type => {
        return 1;
    }

type Schema = {
    mutation: ;
    query: ;
    subscription: ;
}

function makeSchema(): Schema {

}

function clientOf(schema: Schema, transportImpl: ClientTransport) {

}

function serverFor(schema: Schema, transportImpl: ServerTransport) {

}