const { getAllFilePathsWithExtension, readFile, getFileName } = require('./fileSystem');
const { readLine } = require('./console');

const TABLE_CELL_MAX_LENGTHS = {'user': 10, 'date': 10, 'comment': 50, 'filename': 15};
const TABLE_CELL_MIN_LENGTHS = {'user': 4, 'date': 4, 'comment': 7, 'filename': 8};
const todoObjects = [];
app();

function app () {
    getFiles().forEach(f =>
        getTodos(f[0]).forEach(t =>
            todoObjects.push(getTodoObject(t, getFileName(f[1])))));
    console.log('Please, write your command!');
    readLine(processCommand);
}

function getFiles () {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => [readFile(path, 'utf8'), path]);
}

function processCommand (command) {
    const splittedCommand = command.split(' ');
    const action = splittedCommand[0];
    const parameter = splittedCommand[1];
    switch (action) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            printTable(todoObjects);
            break;
        case 'important':
            todoObjects.sort(compareImportance);
            printTable(getImportantTodos());
            break;
        case 'user':
            printTable(getTodosByUser(parameter));
            break;
        case 'sort':
            switch (parameter) {
                case 'importance':
                    printTable(todoObjects.sort(compareImportance));
                    break;
                case 'user':
                    printTable(todoObjects.sort(compareUsers));
                    break;
                case 'date':
                    printTable(todoObjects.sort(compareTimestamps));
                    break;
                default:
                    console.log('wrong parameter, use parameters \'importance\', \'user\' or \'date\'');
                    break;
            }
            break;
        case 'date':
            if (isCorrectDate(parameter)) {
                todoObjects.sort(compareTimestamps);
                printTable(getTodosAfterDate(parameter));
            } else {
                console.log("Please, write parameter in correct format yyyy[-mm-dd] with correct values")
            }
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function getTodos(file) {
    return file.match(/\/\/ ?TODO( |:|: | : | +).*(; ?.*; ?.*)?\n?/gm) || [];
}

function getTodoObject(todo, filename) {
    let user = (todo.match(/TODO( |:|: | : | +)(.*?); ?/i) || '   ')[2];
    let date = (todo.match(/; ?(.*); ?/i) || '  ')[1];
    let timestamp = Date.parse(date);
    let exclamationsCount = (todo.match(/!/ig) || []).length;
    let comment = (todo.match(/(\d{4}-\d{2}-\d{2}|; ?); ?(.*)\n?/) ||
        todo.match(/TODO( |:|: | : | +)(.*)\n?/))[2];
    return {'text': todo, 'user': user, 'date': date, 'timestamp': timestamp,
        'exclamationsCount': exclamationsCount, 'comment': comment, 'filename': filename};
}

function getImportantTodos() {
    return todoObjects.filter(t => t.exclamationsCount > 0);
}

function getTodosByUser(user) {
    return todoObjects.filter(t => t.user.toLowerCase().startsWith(user.toLowerCase()));
}

function getTodosAfterDate(date) {
    let timestamp = (new Date(date)).valueOf();
    return todoObjects.filter(t => t.timestamp >= timestamp);
}

function compareImportance(obj1, obj2) {
    return obj1.exclamationsCount <= obj2.exclamationsCount ? 1 : -1;
}

function compareUsers(obj1, obj2) {
    const u1 = obj1.user;
    const u2 = obj2.user;
    if ((u1 === '' || u1 === ' ') && u2 !== '' && u2 !== ' ')
        return 1;
    if ((u2 === '' || u2 === ' ') && u1 !== '' && u1 !== ' ')
        return -1;
    if ((u1 === '' || u1 === ' ') && (u2 === '' || u2 === ' '))
        return -1;
    if (u1 >= u2) {
        if (u1.toLowerCase() > u2.toLowerCase()) return 1;
        else return -1;
    }
    else {
        if (u1.toLowerCase() > u2.toLowerCase()) return 1;
        else return -1;
    }
}

function compareTimestamps(obj1, obj2) {
    const t1 = obj1.timestamp;
    const t2 = obj2.timestamp;
    if (isNaN(t1) && !isNaN(t2))
        return 1;
    if (isNaN(t2) && ! isNaN((t1)))
        return -1;
    if (isNaN(t1) && isNaN(t2))
        return -1;
    return obj1.timestamp < obj2.timestamp ? 1 : -1;
}

function getMaxLength(todoObjects, propertyName) {
    const maxLength = todoObjects.reduce(function (prevValue, currElem) {
        let currLen = currElem[propertyName].length;
        return (currLen > prevValue) ? currLen : prevValue;
    }, 0);
    const constMaxLength = TABLE_CELL_MAX_LENGTHS[propertyName];
    const constMinLength = TABLE_CELL_MIN_LENGTHS[propertyName];
    return maxLength > constMaxLength ? constMaxLength : (maxLength < constMinLength ? constMinLength : maxLength);
}

function getTable(todoObjects) {
    let table = '';
    const userLen = getMaxLength(todoObjects, 'user') ;
    const dateLen = getMaxLength(todoObjects, 'date');
    const commentLen = getMaxLength(todoObjects, 'comment');
    const filenameLen = getMaxLength(todoObjects, 'filename');
    const firstLine =  getFirstLine(userLen, dateLen, commentLen, filenameLen);
    const delimiter = '-'.repeat(firstLine.length-1) + '\n';
    table += firstLine;
    table += delimiter;
    todoObjects.forEach(obj => {
        table += getLine(userLen, dateLen, commentLen, filenameLen, isImportant(obj), obj.user, obj.date, obj.comment, obj.filename);
    });
    if (todoObjects.length !== 0)
        table += delimiter;
    return table;
}

function isImportant(todoObject) {
    return todoObject.exclamationsCount > 0;
}

function getFirstLine(userLen, dateLen, commentLen, filenameLen) {
    return getLine(userLen, dateLen, commentLen, filenameLen, true, 'user', 'date', 'comment', 'fileName');
}

function getLine(userLen, dateLen, commentLen, filenameLen, importance, user, date, comment, filename) {
    const importanceMark = importance ? '!' : ' ';
    return `  ${importanceMark}  |${getTableCell(userLen, user)}|${getTableCell(dateLen, date)}|${getTableCell(commentLen, comment)}|${getTableCell(filenameLen, filename)}\n`;
}

function getTableCell(maxLength, sentence) {
    if (sentence.length > maxLength)
        return '  ' + sentence.substring(0, maxLength-3) + '...  ';
    let rest = maxLength - sentence.length;
    return '  ' + sentence + ' '.repeat(rest) + '  ';
}

function printTable(todoObjects) {
    console.log(getTable(todoObjects));
}

function isCorrectDate(date) {
    const first = /^\d{4}$/g.test(date);
    const second = /^\d{4}(-0\d|-1[0-2])$/g.test(date);
    const third = /^\d{4}(-0\d|-1[0-2])(-[0-2]\d|-3[0-1])$/g.test(date);
    return first || second || third;
}


// TODO you can do it!
