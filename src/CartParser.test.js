import CartParser from './CartParser';
let parser;

beforeEach(() => {
	parser = new CartParser();
});

describe('validation', () => {
	it('should return empty array when data is suitable', () => {

		const text = `Product name,Price,Quantity
		Mollis consequat,9.00,2
		Tvoluptatem,10.32,1
		Scelerisque lacinia,18.90,1
		Consectetur adipiscing,28.72,10
		Condimentum aliquet,13.90,1`;

		const errors = parser.validate(text);

		expect(errors).toEqual([]);
	});

	it('should return array with an error(object) that contains property type:"header" when header does not have expected name', () => {

		const text=`Product name1,Price,Quantity
		Mollis consequat,9.00,2
		Tvoluptatem,10.32,1
		Scelerisque lacinia,18.90,1
		Consectetur adipiscing,28.72,10
		Condimentum aliquet,13.90,1`;

		const errors=parser.validate(text);

		expect(errors[0]).toHaveProperty("type", "header");
	});

	it('should return array with an error(object) that contains property type:"row" when row count does not match 3', () => {
		
		const text=`Product name,Price,Quantity
		Mollis consequat,9.00
		Tvoluptatem,10.32
		Scelerisque lacinia,18.90
		Consectetur adipiscing,28.72
		Condimentum aliquet,13.90`;

		const errors=parser.validate(text);

		expect(errors[0]).toHaveProperty("type", "row");
	});

	it('should return a number of calls to the createError function (4 in this example)', () => {
		
		const text=`Product name,Price,Quantity
		Mollis consequat,9.00 , 4
		Tvoluptatem,10.32, -5
		Scelerisque lacinia, -18.90, 3
		Consectetur adipiscing, -28.72, 2
		Condimentum aliquet,13.90, -1`;
		parser.createError = jest.fn();

		parser.validate(text);

		expect(parser.createError.mock.calls.length).toBe(4);
	});

	it('should return array with an error(object) that contains property type:"cell" when received empty cell', () => {
		
		const text=`Product name,Price,Quantity
		,9.00,2
	   Tvoluptatem,10.32,1
	   Scelerisque lacinia,18.90,1
	   Consectetur adipiscing,28.72,10
	   Condimentum aliquet,13.90,1`;

	   const errors=parser.validate(text);

		expect(errors[0]).toHaveProperty("type", "cell");
	});
	
	it('should return array with an error(object) that contains property type:"cell" if received negative number', () => {
		
		const text=`Product name,Price,Quantity
		Mollis consequat,9.00,-2
		Tvoluptatem,10.32,1
		Scelerisque lacinia,18.90,1
		Consectetur adipiscing,28.72,10
		Condimentum aliquet,13.90,1`;

		const errors=parser.validate(text);

		expect(errors[0]).toHaveProperty("type", "cell");
	});
});

describe('parse', () => {
	it('should throw error when data is not valid', () => {
		const testPath = './example.csv';
		const text = `Product name,Price,Quantity
		Mollis consequat,9.00,-2
		Tvoluptatem,10.32,1
		Scelerisque lacinia,18.90,1
		Consectetur adipiscing,28.72,10
		Condimentum aliquet,13.90,1`;
		parser.readFile = jest.fn(path => text);

		const parseCall = () => parser.parse(testPath);

		expect(parseCall).toThrow('Validation failed!');
	});

	it('should return parsed array of items and calculated total price when data is valid', () => {
		const testPath = './example.csv';
		const text = `Product name,Price,Quantity
		test1,5,6
		test2,10,6`;
		const readFileMock = jest.fn(path => text);
		parser.readFile = readFileMock;

		const result = parser.parse(testPath);

		expect(result.items[0]).toHaveProperty('name', 'test1');
		expect(result.items[0]).toHaveProperty('price', 5);
		expect(result.items[0]).toHaveProperty('quantity', 6);
		expect(result.items[1]).toHaveProperty('name', 'test2');
		expect(result.items[1]).toHaveProperty('price', 10);
		expect(result.items[1]).toHaveProperty('quantity', 6);
		expect(result.total).toEqual(90);
	});
});


describe('calcTotal', () => {
	it('should return calculated total sum of items', () => {
		const itemArray = [{
				id: 1,
				name: 'test1',
				price: '5',
				quantity: '4'
			},
			{
				id: 2,
				name: 'test2',
				price: '2',
				quantity: '50'
			},
			{
				id: 3,
				name: 'test3',
				price: '4',
				quantity: '30'
			},
			{
				id: 4,
				name: 'test4',
				price: '20',
				quantity: '1'
			}
		];

		const total = parser.calcTotal(itemArray);

		expect(total).toEqual(260);
	});
});


describe('parseLine', () => {
	it('should convert line into object with keys and values from the line', () => {
		const line = "Mollis consequat,9.00,2";

		const object = parser.parseLine(line);

		expect(object.name).toEqual("Mollis consequat");
		expect(object.price).toEqual(9.00);
		expect(object.quantity).toEqual(2);
	});

	it('should convert line into object with keys and values from the line using mocked columns', () => {
		const line = "TestString,  testString2, 3";

		parser.schema.columns = ([{
				name: 'TestName',
				key: 'testName',
				type: parser.ColumnType.STRING
			},
			{
				name: 'TestTet',
				key: 'testText',
				type: parser.ColumnType.STRING
			},
			{
				name: 'TestValue2',
				key: 'testValue2',
				type: parser.ColumnType.NUMBER_POSITIVE
			}
		]);

		const result = parser.parseLine(line);

		expect(result.testName).toEqual('TestString');
		expect(result.testText).toEqual('testString2');
		expect(result.testValue2).toEqual(3);
	});
});

describe('CartParser - integration test', () => {
	it('should return parsed array of items from the file  and calculated total price when data is valid', () => {
		const result = parser.parse(`${process.cwd()}/samples/cart.csv`);

		expect(result.items[0]).toHaveProperty('name', 'Mollis consequat');
		expect(result.items[0]).toHaveProperty('price', 9.00);
		expect(result.items[0]).toHaveProperty('quantity', 2);
		expect(result.items[1]).toHaveProperty('name', 'Tvoluptatem');
		expect(result.items[1]).toHaveProperty('price', 10.32);
		expect(result.items[1]).toHaveProperty('quantity', 1);
		expect(result.total).toEqual(348.32);
	});
});