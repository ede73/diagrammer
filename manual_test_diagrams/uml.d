{Person;Person
name;+String
birth;#Date
getCurrentAge;+(): int
}

{Student;Student
classes;_List<Class>
attend;-(class: Course)
sleep;-()
}

{Course;Course
name;+String
description;+String
professor1;+professor: Professor
location;+String
times;+List<Time>
prerequisites;+List<Course>
students;+List<Student>
}

{Professor;Professor
classes1;+classes: List<Class>
teach;-teach(class: Course)
}

{BankAccount;BankAccount
owner;+String
balance;+Currency=0
deposit;+(amount: Currency)
withdraw;+(amount: Currency)
}

Student,Professor>Person
Course.Professor
