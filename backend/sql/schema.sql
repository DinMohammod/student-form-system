create table users(
    id serial primary key,
    userName varchar(100) not null,
    email varchar(150) unique not null,
    password varchar(255) not null,
    role varchar(20) not null default 'user' check(role in('user','admin')),
    created_at timeStamp default Current_timeStamp,
    updated_at timeStamp default Current_timeStamp
);

--personal information
create table personal_information(
    id serial primary key,
    user_id int unique not null references users(id) ON DELETE CASCADE,
    first_name varchar(100) not null,
    surname varchar(100) not null,
    gender varchar(20) not null check(gender in('Male','Female','Other')),
    dob date not null,
    mobile varchar(20) not null,
    email varchar(150) not null,
    present_address text,
    permanent_address text,
    photo_url varchar(255),
    created_at timeStamp default Current_timeStamp,
    updated_at timeStamp default Current_timeStamp
);

--family information table
create table family_information(
    id serial primary key,
    user_id int unique not null references users(id) ON DELETE CASCADE,
    father_name varchar(100),
    father_occupation varchar(100),
    father_mobile varchar(20),
    mother_name varchar(100),
    mother_occupation varchar(100),
    mother_mobile varchar(20),
    number_of_siblings int not null default 0 check(number_of_siblings>=0),
    created_at timeStamp default Current_timeStamp,
    updated_at timeStamp default Current_timeStamp

);

create table siblings(
    id serial primary key,
    family_id int not null references family_information(id) ON DELETE CASCADE,
    sibling_name varchar(100) not null,
    sibling_relation varchar(50) not null
);

create table education(
    id serial primary key,
    user_id int unique not null references users(id) ON DELETE CASCADE,
    school_name varchar(150),
    ssc_board varchar(100),
    ssc_gpa numeric(3,2) check(ssc_gpa >=0 and ssc_gpa <= 5.00),
    ssc_year int check(ssc_year >= 1990 and ssc_year<=2100),
    college_name varchar(150),
    hsc_board varchar(100),
    hsc_gpa numeric(3,2) check(hsc_gpa>=0 and hsc_gpa<= 5.00),
    hsc_year int check(hsc_year>=1990 and hsc_year<=2100),
    university varchar(150),
    department varchar(100),
    semester varchar(50),
    cgpa numeric(3,2) check(cgpa>=0 and cgpa<=4),
    created_at timeStamp default Current_timeStamp,
    updated_at timeStamp default Current_timeStamp
);

--skills table
create table skills(
    id serial primary key,
    user_id int not null references users(id) ON DELETE CASCADE,
    skill_name varchar(100) not null,
    proficiency varchar(20) not null check(proficiency in('Beginner','Intermediate','Advanced','Expert'))
);

--experience table
create table experience(
    id serial primary key,
    user_id int not null references users(id) ON DELETE CASCADE,
    company_name varchar(150) not null,
    position varchar(100) not null,
    start_date date not null,
    end_date date,
    is_current boolean not null default false,
    description text
);

--indexes (for query fast)
create index idx_personal_user_id on personal_information(user_id);
create index idx_family_user_id on family_information(user_id);
create index idx_siblings_family_id on siblings(family_id);
create index idx_education_user_id on education(user_id);
create index idx_skills_user_id on skills(user_id);
create index idx_experience_user_id on experience(user_id);


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personal_updated_at BEFORE UPDATE ON personal_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_updated_at BEFORE UPDATE ON family_information
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();