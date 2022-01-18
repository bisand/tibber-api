export interface IErrors {
    message: string;
    locations: [
        {
            line: number;
            column: number;
        },
    ];
    path: string[];
    extensions: {
        code: string;
    };
}
