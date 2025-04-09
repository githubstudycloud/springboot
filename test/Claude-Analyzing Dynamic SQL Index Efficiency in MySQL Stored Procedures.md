
# Claude Conversation

## Prompt:
如何对存储过程里的所有的动态sql进行分析索引效率，但不在存储过程里添加代码，对于mysql

## Response:
 我很乐意帮您解决关于MySQL存储过程中动态SQL索引效率分析的问题。在不修改存储过程代码的情况下，有几种有效的方法可以分析索引效率。

要分析MySQL存储过程中动态SQL的索引效率，您可以采用以下方法：

1. **使用性能模式(Performance Schema)**
   - 开启performance_schema可以帮助您捕获存储过程执行时生成的实际SQL语句
   - 通过events_statements_history表分析每条SQL的执行计划和性能数据

2. **使用general_log和慢查询日志**
   - 临时开启general_log捕获所有执行的SQL语句
   - 设置适当的慢查询阈值，捕获执行时间较长的SQL

3. **使用EXPLAIN ANALYZE**
   - 对捕获到的动态SQL使用EXPLAIN ANALYZE进行分析
   - 查看执行计划以及索引使用情况

4. **利用MySQL企业版监控工具**
   - 如MySQL Enterprise Monitor可以提供更全面的监控
   - 实时捕获并分析动态SQL

5. **使用代理层工具**
   - 如ProxySQL或MySQLProxy等工具可以在不修改代码的情况下捕获所有SQL

6. **使用查询分析器工具**
   - 如Percona PMM (Percona Monitoring and Management)可以提供全面的查询分析
   - 识别有问题的查询模式并提供优化建议

下面我可以详细介绍其中几种关键方法的具体实施步骤。您需要我详细展开哪一种方法呢？

## Prompt:
我的存储过程是多层嵌套，不止一个，是多个，大概400多个。是能只指定分析存储过程吗，其余的sql查询不管

## Response:
 针对多层嵌套、数量庞大(400多个)的存储过程进行选择性分析，确实需要更有针对性的方法。在不修改存储过程代码的情况下，您可以专门针对特定存储过程进行索引效率分析：

## 专门针对特定存储过程的分析方法

1. **使用Performance Schema精确捕获特定存储过程**
   - 配置performance_schema只监控特定的存储过程
   - 通过setup_objects表限定监控范围
   ```sql
   UPDATE performance_schema.setup_objects 
   SET ENABLED = 'NO' 
   WHERE OBJECT_TYPE = 'PROCEDURE';
   
   INSERT INTO performance_schema.setup_objects 
   (OBJECT_TYPE, OBJECT_SCHEMA, OBJECT_NAME, ENABLED, TIMED) 
   VALUES ('PROCEDURE', '您的数据库名', '目标存储过程名', 'YES', 'YES');
   ```

2. **使用触发器记录特定存储过程的调用**
   - 创建临时表记录目标存储过程的执行情况
   - 通过触发器捕获过程执行时的SQL

3. **使用MySQL审计插件**
   - 配置MySQL审计插件(如MySQL Enterprise Audit)只审计特定存储过程
   - 设置过滤规则只捕获目标存储过程执行的SQL

4. **使用ProxySQL进行选择性监控**
   - 配置ProxySQL规则只捕获特定存储过程的查询
   - 可以设置模式匹配规则识别存储过程调用

5. **批量分析工具**
   - 使用pt-query-digest工具结合日志分析
   - 编写过滤脚本只分析特定存储过程生成的SQL

6. **使用存储过程调用跟踪**
   - 临时开启存储过程调用跟踪(profiling)
   ```sql
   SET profiling = 1;
   CALL your_procedure(params);
   SHOW PROFILE;
   ```

针对您的400多个存储过程，我建议采用以下步骤进行批量分析：

1. 首先创建一个临时表存储所有目标存储过程名称
2. 编写脚本循环启用Performance Schema监控每个存储过程
3. 触发存储过程执行并收集执行数据
4. 分析每个存储过程产生的动态SQL并评估索引效率

如果您想更详细了解其中某个特定方法，或者需要针对您的环境的具体实施方案，请告诉我，我可以提供更详细的步骤。

## Prompt:
我用的社区版本的5.7，请为我选择合适的步骤，并详细告诉我如何操作

## Response:
 针对MySQL 5.7社区版，我来为您提供一个适合分析存储过程中动态SQL索引效率的详细操作方案。考虑到您有400多个嵌套的存储过程需要分析，我会选择最实用且不需要额外插件的方法。

## MySQL 5.7社区版分析存储过程索引效率的详细步骤

### 1. 配置Performance Schema监控特定存储过程

**第一步：确保Performance Schema已启用**

```sql
SHOW VARIABLES LIKE 'performance_schema';
```

如果返回值为OFF，需要在my.cnf配置文件中添加以下行并重启MySQL：

```
[mysqld]
performance_schema=ON
```

**第二步：创建临时表存储目标存储过程列表**

```sql
CREATE TABLE temp_proc_list (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proc_name VARCHAR(255),
    analyzed BOOLEAN DEFAULT FALSE
);

-- 填充存储过程列表
INSERT INTO temp_proc_list (proc_name)
SELECT ROUTINE_NAME 
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_SCHEMA = '您的数据库名' 
AND ROUTINE_TYPE = 'PROCEDURE';
```

**第三步：配置Performance Schema只关注存储过程**

```sql
-- 重置Performance Schema设置
UPDATE performance_schema.setup_consumers SET ENABLED = 'NO';
UPDATE performance_schema.setup_instruments SET ENABLED = 'NO', TIMED = 'NO';

-- 启用语句和阶段监控
UPDATE performance_schema.setup_consumers
SET ENABLED = 'YES'
WHERE NAME LIKE '%statements%' OR NAME LIKE '%stages%';

-- 启用存储过程相关的instrument
UPDATE performance_schema.setup_instruments
SET ENABLED = 'YES', TIMED = 'YES'
WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE '%statement/sql/%';

-- 清空历史表以便分析
TRUNCATE TABLE performance_schema.events_statements_history;
TRUNCATE TABLE performance_schema.events_statements_history_long;
```

### 2. 创建分析脚本

创建一个存储过程来分析目标存储过程的索引使用情况：

```sql
DELIMITER //

CREATE PROCEDURE analyze_proc_dynamic_sql()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE proc_name VARCHAR(255);
    DECLARE cur CURSOR FOR SELECT proc_name FROM temp_proc_list WHERE analyzed = FALSE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    -- 创建临时结果表
    DROP TABLE IF EXISTS proc_sql_analysis;
    CREATE TABLE proc_sql_analysis (
        proc_name VARCHAR(255),
        sql_text LONGTEXT,
        exec_count INT,
        total_latency VARCHAR(100),
        max_latency VARCHAR(100),
        avg_latency VARCHAR(100),
        rows_sent BIGINT,
        rows_examined BIGINT,
        index_usage TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    OPEN cur;
    proc_loop: LOOP
        FETCH cur INTO proc_name;
        IF done THEN
            LEAVE proc_loop;
        END IF;
        
        -- 清空历史表准备捕获新的存储过程执行
        TRUNCATE TABLE performance_schema.events_statements_history_long;
        
        -- 执行存储过程 (需要替换为实际参数)
        SET @sql = CONCAT('CALL ', proc_name, '(/* 替换为适当的参数 */)');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        -- 等待数据收集完成
        DO SLEEP(1);
        
        -- 收集动态SQL分析结果
        INSERT INTO proc_sql_analysis (
            proc_name, sql_text, exec_count, total_latency, 
            max_latency, avg_latency, rows_sent, rows_examined, index_usage
        )
        SELECT 
            proc_name,
            SUBSTRING_INDEX(SQL_TEXT, '/*', 1) AS sql_text,
            COUNT_STAR AS exec_count,
            SUM_TIMER_WAIT AS total_latency,
            MAX_TIMER_WAIT AS max_latency,
            AVG_TIMER_WAIT AS avg_latency,
            SUM_ROWS_SENT AS rows_sent,
            SUM_ROWS_EXAMINED AS rows_examined,
            CONCAT('需要EXPLAIN分析') AS index_usage
        FROM performance_schema.events_statements_history_long
        WHERE SQL_TEXT NOT LIKE 'CALL %'  -- 排除CALL语句本身
        AND SQL_TEXT NOT LIKE 'SET %'     -- 排除SET语句
        AND SQL_TEXT IS NOT NULL;
        
        -- 标记为已分析
        UPDATE temp_proc_list SET analyzed = TRUE WHERE proc_name = proc_name;
    END LOOP;
    
    CLOSE cur;
    
    -- 显示分析结果
    SELECT * FROM proc_sql_analysis ORDER BY rows_examined DESC, total_latency DESC;
END //

DELIMITER ;
```

### 3. 执行分析并收集动态SQL

```sql
CALL analyze_proc_dynamic_sql();
```

### 4. 对捕获的动态SQL进行EXPLAIN分析

对于proc_sql_analysis表中捕获的SQL，您需要手动对其进行EXPLAIN分析。以下是一个辅助存储过程来帮助执行这个任务：

```sql
DELIMITER //

CREATE PROCEDURE explain_captured_sql()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_sql LONGTEXT;
    DECLARE v_proc VARCHAR(255);
    DECLARE v_id INT;
    DECLARE cur CURSOR FOR 
        SELECT id, proc_name, sql_text 
        FROM proc_sql_analysis 
        WHERE index_usage = '需要EXPLAIN分析';
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    -- 创建EXPLAIN结果表
    DROP TABLE IF EXISTS explain_results;
    CREATE TABLE explain_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_id INT,
        proc_name VARCHAR(255),
        sql_text LONGTEXT,
        explain_result LONGTEXT
    );
    
    OPEN cur;
    explain_loop: LOOP
        FETCH cur INTO v_id, v_proc, v_sql;
        IF done THEN
            LEAVE explain_loop;
        END IF;
        
        -- 尝试执行EXPLAIN
        BEGIN
            DECLARE CONTINUE HANDLER FOR 1064 BEGIN END; -- 忽略SQL语法错误
            
            SET @explain_sql = CONCAT('EXPLAIN FORMAT=JSON ', v_sql);
            SET @explain_result = NULL;
            
            PREPARE stmt FROM @explain_sql;
            EXECUTE stmt;
            
            -- 获取EXPLAIN结果(这里只能模拟，实际需要客户端捕获)
            SET @explain_result = 'EXPLAIN结果需要在客户端执行获取';
            
            -- 存储结果
            INSERT INTO explain_results (proc_id, proc_name, sql_text, explain_result)
            VALUES (v_id, v_proc, v_sql, @explain_result);
            
            DEALLOCATE PREPARE stmt;
        END;
    END LOOP;
    
    CLOSE cur;
    
    -- 更新主表
    UPDATE proc_sql_analysis p
    JOIN explain_results e ON p.id = e.proc_id
    SET p.index_usage = '已分析';
    
    -- 显示需要手动EXPLAIN的SQL
    SELECT p.id, p.proc_name, p.sql_text
    FROM proc_sql_analysis p
    WHERE p.index_usage = '需要EXPLAIN分析'
    ORDER BY p.rows_examined DESC, p.total_latency DESC
    LIMIT 50;
END //

DELIMITER ;
```

### 5. 索引效率分析报告

创建一个存储过程来生成最终报告:

```sql
DELIMITER //

CREATE PROCEDURE generate_index_efficiency_report()
BEGIN
    -- 创建索引效率分析报告表
    DROP TABLE IF EXISTS index_efficiency_report;
    CREATE TABLE index_efficiency_report (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_name VARCHAR(255),
        sql_pattern VARCHAR(1000),
        avg_rows_examined BIGINT,
        avg_rows_sent BIGINT,
        efficiency_ratio DECIMAL(10,2),
        exec_count INT,
        avg_latency VARCHAR(100),
        recommendation TEXT
    );
    
    -- 填充报告
    INSERT INTO index_efficiency_report (
        proc_name, sql_pattern, avg_rows_examined, avg_rows_sent, 
        efficiency_ratio, exec_count, avg_latency, recommendation
    )
    SELECT 
        proc_name,
        -- 提取SQL模式，去除具体参数值
        REGEXP_REPLACE(sql_text, '\'[^\']*\'', '?') AS sql_pattern,
        rows_examined / exec_count AS avg_rows_examined,
        rows_sent / exec_count AS avg_rows_sent,
        rows_sent / rows_examined * 100 AS efficiency_ratio,
        exec_count,
        avg_latency,
        CASE 
            WHEN rows_sent / rows_examined < 0.01 THEN '索引效率极低，需要优化'
            WHEN rows_sent / rows_examined < 0.1 THEN '索引效率较低，建议优化'
            WHEN rows_sent / rows_examined < 0.5 THEN '索引效率一般，可考虑优化'
            ELSE '索引效率良好'
        END AS recommendation
    FROM proc_sql_analysis
    WHERE rows_examined > 0
    GROUP BY sql_pattern
    ORDER BY efficiency_ratio ASC, avg_rows_examined DESC;
    
    -- 显示报告
    SELECT * FROM index_efficiency_report;
END //

DELIMITER ;
```

### 6. 使用方法总结

1. 执行步骤1中的SQL设置Performance Schema
2. 创建步骤2-5中的分析存储过程
3. 执行`CALL analyze_proc_dynamic_sql()`开始分析存储过程
4. 针对捕获的SQL执行`CALL explain_captured_sql()`获取需要手动分析的SQL
5. 对需要手动分析的SQL使用EXPLAIN进行分析
6. 执行`CALL generate_index_efficiency_report()`生成最终报告

### 注意事项

1. 确保在测试环境中执行此分析，因为它会真实调用存储过程
2. 需要为存储过程提供适当的参数，可能需要根据实际情况修改脚本
3. Performance Schema会消耗一定系统资源，分析完成后可能需要恢复原始设置
4. 对于特别复杂的动态SQL，可能需要手动分析

这个方案完全适用于MySQL 5.7社区版，不需要额外的插件，同时能够有效地分析存储过程中的动态SQL索引效率。

## Prompt:
如果我的java程序也在定时执行存储过程会被捕捉到吗？我的定时器会执行很多存储过程，多次传递不同参数，会和我手动生成到日志表而无法分清吗

## Response:
 您提出了一个非常好的问题。确实，如果您的Java程序也在定时执行存储过程，这会给我们的分析带来挑战。让我来调整方案以解决这个问题。

## 处理Java程序定时执行存储过程的问题

确实，如果您的Java程序正在并行定时执行存储过程（可能使用相同存储过程但传递不同参数），这会导致Performance Schema捕获的数据混合在一起，难以区分哪些执行是由您的分析触发的，哪些是由Java程序触发的。

### 解决方案：使用会话隔离和标记

我们可以通过以下方式解决这个问题：

1. **使用特定连接会话进行分析**
   - Performance Schema可以按会话ID过滤
   - 为分析创建专用的数据库连接

2. **在分析期间添加临时标记**
   - 在执行前添加特殊注释标记
   - 使用连接属性区分分析会话

以下是修改后的详细步骤：

### 1. 创建专用会话标识

```sql
-- 设置唯一的会话标识
SET @analysis_session = CONCAT('PROC_ANALYSIS_', UUID());
SET SESSION session_track_system_variables = 'session_track_gtids';
```

### 2. 修改分析存储过程

```sql
DELIMITER //

CREATE PROCEDURE analyze_proc_dynamic_sql()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE proc_name VARCHAR(255);
    DECLARE cur CURSOR FOR SELECT proc_name FROM temp_proc_list WHERE analyzed = FALSE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
    
    -- 创建临时结果表（如果不存在）
    CREATE TABLE IF NOT EXISTS proc_sql_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_name VARCHAR(255),
        session_id VARCHAR(100),
        execution_time TIMESTAMP,
        sql_text LONGTEXT,
        exec_count INT,
        total_latency VARCHAR(100),
        max_latency VARCHAR(100),
        avg_latency VARCHAR(100),
        rows_sent BIGINT,
        rows_examined BIGINT,
        index_usage TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- 记录当前连接ID
    SET @connection_id = CONNECTION_ID();
    SET @session_id = @analysis_session;
    
    OPEN cur;
    proc_loop: LOOP
        FETCH cur INTO proc_name;
        IF done THEN
            LEAVE proc_loop;
        END IF;
        
        -- 清空历史表准备捕获新的存储过程执行
        -- 但仅关注我们当前的连接ID
        DELETE FROM performance_schema.events_statements_history_long 
        WHERE THREAD_ID = @connection_id;
        
        -- 添加标记并执行存储过程（假设存储过程可以不带参数执行）
        SET @start_time = NOW();
        SET @sql = CONCAT('CALL ', proc_name, '(/* ANALYSIS_SESSION:', @session_id, ' */)');
        
        BEGIN
            -- 捕获可能的错误
            DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
            BEGIN
                -- 记录错误但继续分析
                INSERT INTO proc_sql_analysis (proc_name, session_id, execution_time, sql_text, exec_count)
                VALUES (proc_name, @session_id, @start_time, '存储过程执行错误', 0);
            END;
            
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
        END;
        
        -- 等待数据收集完成
        DO SLEEP(1);
        
        -- 收集动态SQL分析结果，但只收集当前连接产生的
        INSERT INTO proc_sql_analysis (
            proc_name, session_id, execution_time, sql_text, exec_count, 
            total_latency, max_latency, avg_latency, rows_sent, rows_examined, index_usage
        )
        SELECT 
            proc_name,
            @session_id,
            @start_time,
            SUBSTRING_INDEX(SQL_TEXT, '/*', 1) AS sql_text,
            COUNT_STAR AS exec_count,
            SUM_TIMER_WAIT AS total_latency,
            MAX_TIMER_WAIT AS max_latency,
            AVG_TIMER_WAIT AS avg_latency,
            SUM_ROWS_SENT AS rows_sent,
            SUM_ROWS_EXAMINED AS rows_examined,
            CONCAT('需要EXPLAIN分析') AS index_usage
        FROM performance_schema.events_statements_history_long
        WHERE THREAD_ID = @connection_id    -- 只关注当前连接
        AND SQL_TEXT NOT LIKE 'CALL %'      -- 排除CALL语句本身
        AND SQL_TEXT NOT LIKE 'SET %'       -- 排除SET语句
        AND SQL_TEXT IS NOT NULL
        AND CURRENT_SCHEMA = DATABASE();    -- 只关注当前数据库
        
        -- 标记为已分析
        UPDATE temp_proc_list SET analyzed = TRUE WHERE proc_name = proc_name;
    END LOOP;
    
    CLOSE cur;
    
    -- 显示分析结果（仅显示本次分析产生的结果）
    SELECT * FROM proc_sql_analysis 
    WHERE session_id = @session_id
    ORDER BY rows_examined DESC, total_latency DESC;
END //

DELIMITER ;
```

### 3. 创建执行计划和索引分析功能

下面是修改后的执行计划分析存储过程，它将避免与Java程序产生的执行混淆：

```sql
DELIMITER //

CREATE PROCEDURE analyze_specific_proc_with_param(
    IN p_proc_name VARCHAR(255),
    IN p_params VARCHAR(1000)  -- 参数字符串，例如 "'param1', 123, 'param3'"
)
BEGIN
    -- 设置会话标识
    SET @analysis_session = CONCAT('PROC_PARAM_ANALYSIS_', UUID());
    SET @connection_id = CONNECTION_ID();
    
    -- 清空历史表准备捕获新的存储过程执行（仅关注当前连接）
    DELETE FROM performance_schema.events_statements_history_long 
    WHERE THREAD_ID = @connection_id;
    
    -- 执行带特定参数的存储过程
    SET @start_time = NOW();
    SET @sql = CONCAT('CALL ', p_proc_name, '(', p_params, ')');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- 等待数据收集完成
    DO SLEEP(1);
    
    -- 创建临时表存储本次分析结果
    DROP TABLE IF EXISTS temp_param_analysis;
    CREATE TABLE temp_param_analysis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_name VARCHAR(255),
        param_value VARCHAR(1000),
        sql_text LONGTEXT,
        rows_examined BIGINT,
        rows_sent BIGINT,
        efficiency DECIMAL(10,2),
        latency_us BIGINT
    );
    
    -- 收集结果
    INSERT INTO temp_param_analysis (
        proc_name, param_value, sql_text, rows_examined, 
        rows_sent, efficiency, latency_us
    )
    SELECT 
        p_proc_name,
        p_params,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        CASE WHEN ROWS_EXAMINED > 0 
             THEN (ROWS_SENT / ROWS_EXAMINED) * 100
             ELSE 0 END,
        TIMER_WAIT
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = @connection_id
    AND SQL_TEXT NOT LIKE 'CALL %'
    AND SQL_TEXT NOT LIKE 'SET %'
    AND SQL_TEXT IS NOT NULL;
    
    -- 显示分析结果
    SELECT * FROM temp_param_analysis
    ORDER BY efficiency ASC, rows_examined DESC;
    
    -- 为检测到的每条SQL生成EXPLAIN语句
    SELECT CONCAT('EXPLAIN FORMAT=JSON ', sql_text, ';') AS explain_command
    FROM temp_param_analysis
    WHERE rows_examined > 100
    ORDER BY efficiency ASC, rows_examined DESC
    LIMIT 10;
END //

DELIMITER ;
```

### 4. 创建针对参数变化的索引效率分析

```sql
DELIMITER //

CREATE PROCEDURE analyze_proc_with_different_params(
    IN p_proc_name VARCHAR(255)
)
BEGIN
    -- 创建临时表存储参数测试结果
    DROP TABLE IF EXISTS param_test_results;
    CREATE TABLE param_test_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_name VARCHAR(255),
        param_set VARCHAR(1000),
        total_sql_count INT,
        problematic_sql_count INT,
        avg_efficiency DECIMAL(10,2),
        execution_time BIGINT,
        notes TEXT
    );
    
    -- 这里需要手动添加您想测试的参数集
    -- 例如：
    CALL analyze_specific_proc_with_param(p_proc_name, "'测试参数1', 100");
    INSERT INTO param_test_results (
        proc_name, param_set, total_sql_count, problematic_sql_count, 
        avg_efficiency, execution_time, notes
    )
    SELECT 
        p_proc_name,
        "'测试参数1', 100",
        COUNT(*),
        SUM(IF(efficiency < 1.0, 1, 0)),
        AVG(efficiency),
        SUM(latency_us),
        CONCAT('发现', SUM(IF(rows_examined > 1000, 1, 0)), '条扫描大量行的SQL')
    FROM temp_param_analysis;
    
    -- 可以添加更多参数集的测试
    -- CALL analyze_specific_proc_with_param(p_proc_name, "'测试参数2', 200");
    -- INSERT INTO param_test_results...
    
    -- 显示参数测试结果比较
    SELECT * FROM param_test_results
    ORDER BY avg_efficiency ASC, problematic_sql_count DESC;
END //

DELIMITER ;
```

### 5. 一键分析脚本

创建一个总体分析脚本，可以一次性执行所有需要的步骤：

```sql
DELIMITER //

CREATE PROCEDURE one_click_proc_analysis(
    IN p_database_name VARCHAR(255),  -- 数据库名称
    IN p_proc_name VARCHAR(255),      -- 可选：指定单个存储过程，NULL则分析所有
    IN p_sample_size INT              -- 要分析的存储过程数量，0表示全部
)
BEGIN
    -- 设置环境
    SET @db_name = p_database_name;
    
    -- 创建存储过程列表
    DROP TABLE IF EXISTS temp_proc_list;
    CREATE TABLE temp_proc_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        proc_name VARCHAR(255),
        analyzed BOOLEAN DEFAULT FALSE
    );
    
    -- 填充存储过程列表
    IF p_proc_name IS NULL THEN
        -- 获取所有存储过程
        INSERT INTO temp_proc_list (proc_name)
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES
        WHERE ROUTINE_SCHEMA = @db_name 
        AND ROUTINE_TYPE = 'PROCEDURE'
        ORDER BY ROUTINE_NAME
        LIMIT IF(p_sample_size > 0, p_sample_size, 1000000);
    ELSE
        -- 只分析指定的存储过程
        INSERT INTO temp_proc_list (proc_name)
        VALUES (p_proc_name);
    END IF;
    
    -- 配置Performance Schema
    CALL setup_performance_schema();
    
    -- 运行分析
    CALL analyze_proc_dynamic_sql();
    
    -- 生成报告
    CALL generate_index_efficiency_report();
    
    -- 输出结果
    SELECT 'Analysis completed. Check index_efficiency_report table for results.' AS Message;
END //

CREATE PROCEDURE setup_performance_schema()
BEGIN
    -- 配置Performance Schema专注于SQL语句跟踪
    UPDATE performance_schema.setup_consumers SET ENABLED = 'NO';
    UPDATE performance_schema.setup_instruments SET ENABLED = 'NO', TIMED = 'NO';
    
    -- 启用语句和阶段监控
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%';
    
    -- 启用存储过程和SQL语句相关的instrument
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE '%statement/sql/%';
    
    -- 确保记录长历史
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME = 'events_statements_history_long';
END //

DELIMITER ;
```

### 完整使用方法

1. 执行以下命令开始分析：

```sql
-- 分析单个存储过程
CALL one_click_proc_analysis('您的数据库名', '目标存储过程名', 0);

-- 或者，随机分析10个存储过程
CALL one_click_proc_analysis('您的数据库名', NULL, 10);
```

2. 查看分析报告：

```sql
-- 查看索引效率报告
SELECT * FROM index_efficiency_report
ORDER BY efficiency_ratio ASC
LIMIT 20;

-- 找出最需要优化的存储过程
SELECT proc_name, COUNT(*) AS problem_sql_count
FROM proc_sql_analysis
WHERE rows_examined / rows_sent > 100
GROUP BY proc_name
ORDER BY problem_sql_count DESC;
```

3. 针对特定存储过程测试不同参数的影响：

```sql
-- 分析特定存储过程在不同参数下的性能
CALL analyze_proc_with_different_params('问题存储过程名');
```

### 额外说明

1. 这套方案通过会话ID和连接ID的隔离，确保只分析我们主动触发的存储过程执行，不会与Java程序的执行混淆。

2. 对于需要特定参数的存储过程，您需要在`analyze_proc_with_different_params`中手动添加测试参数集。

3. 分析过程中消耗的资源可能会对生产环境造成一定影响，建议在非高峰期或测试环境中执行。

4. 如果某些存储过程需要特殊权限或环境配置才能执行，可能需要额外处理。

这套方案完全适用于MySQL 5.7社区版，不需要额外插件，并且通过会话隔离技术解决了Java程序并行执行的干扰问题。

## Prompt:
我的存储过程是多层嵌套，在一个机器里会和java程序混合顺序执行不同的，我自己动手执行比较复杂，我能否自己在本地启动java，修改代码，执行某个版本的，并且配置mysql只捕获我这个java程序触发的呢

## Response:
 是的，您可以在本地环境中配置Java应用程序和MySQL来专门捕获特定Java程序触发的存储过程执行。这是一个可行的方案，而且相比手动执行存储过程，这种方法能更准确地模拟实际生产环境。

## 配置Java程序和MySQL捕获特定程序的存储过程执行

### 在Java程序端的配置

1. **添加连接标识**
   - 在JDBC连接中添加特殊属性，使MySQL能识别这个连接
   - 修改Java代码以在连接中设置特定参数

```java
// 在Java代码中修改数据库连接设置
Properties connectionProps = new Properties();
connectionProps.put("user", "yourUsername");
connectionProps.put("password", "yourPassword");
// 添加特殊标识符
connectionProps.put("connectionAttributes", "program_name=INDEX_ANALYSIS_TOOL,analysis_id=12345");

Connection conn = DriverManager.getConnection(
    "jdbc:mysql://localhost:3306/yourDatabase", connectionProps);
```

2. **添加注释标识（更简单的方式）**
   - 在Java代码中调用存储过程时添加特殊注释

```java
// 原始调用
CallableStatement stmt = conn.prepareCall("{CALL your_procedure(?, ?)}");

// 修改后调用（添加注释标识）
CallableStatement stmt = conn.prepareCall(
    "{CALL your_procedure(?, ?)} /* INDEX_ANALYSIS_CLIENT */");
```

### 在MySQL端的配置

1. **设置Performance Schema过滤器**
   - 配置MySQL只捕获带有特定注释或连接属性的语句

```sql
-- 创建存储特定分析会话的表
CREATE TABLE analysis_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    connection_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255)
);

-- 创建存储分析结果的表
CREATE TABLE proc_analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    proc_name VARCHAR(255),
    sql_text LONGTEXT,
    rows_examined BIGINT,
    rows_sent BIGINT,
    execution_time BIGINT,
    execution_timestamp TIMESTAMP,
    attribute_value TEXT
);

-- 创建触发器来捕获特定语句
DELIMITER //

CREATE EVENT capture_analysis_statements
ON SCHEDULE EVERY 5 SECOND
DO
BEGIN
    -- 查找标记为分析的连接
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, attribute_value
    )
    SELECT 
        @analysis_id AS session_id,
        IF(INSTR(SQL_TEXT, 'CALL') > 0, 
           SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        CURRENT_TIMESTAMP,
        ATTR_VALUE
    FROM performance_schema.events_statements_history_long s
    JOIN performance_schema.session_connect_attrs a 
    ON s.THREAD_ID = a.THREAD_ID
    WHERE a.ATTR_NAME = 'program_name' 
    AND a.ATTR_VALUE = 'INDEX_ANALYSIS_TOOL'
    AND s.SQL_TEXT NOT IN (SELECT sql_text FROM proc_analysis_results)
    AND s.END_EVENT_ID IS NOT NULL;
    
    -- 或者捕获带有特定注释的语句
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp
    )
    SELECT 
        'COMMENT_BASED' AS session_id,
        IF(INSTR(SQL_TEXT, 'CALL') > 0, 
           SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        CURRENT_TIMESTAMP
    FROM performance_schema.events_statements_history_long
    WHERE SQL_TEXT LIKE '%/* INDEX_ANALYSIS_CLIENT */%'
    AND SQL_TEXT NOT IN (SELECT sql_text FROM proc_analysis_results)
    AND END_EVENT_ID IS NOT NULL;
END //

DELIMITER ;
```

2. **创建分析报告生成器**

```sql
DELIMITER //

CREATE PROCEDURE generate_analysis_report(IN p_session_id VARCHAR(100))
BEGIN
    -- 基础统计
    SELECT 
        proc_name,
        COUNT(*) AS execution_count,
        AVG(rows_examined) AS avg_rows_examined,
        AVG(rows_sent) AS avg_rows_sent,
        AVG(IF(rows_examined > 0, rows_sent/rows_examined, 0)) * 100 AS efficiency_pct,
        AVG(execution_time/1000000) AS avg_exec_time_ms
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND proc_name != ''
    GROUP BY proc_name
    ORDER BY efficiency_pct ASC, avg_rows_examined DESC;
    
    -- 问题SQL
    SELECT 
        sql_text,
        COUNT(*) AS occurrence_count,
        AVG(rows_examined) AS avg_rows_examined,
        AVG(rows_sent) AS avg_rows_sent,
        AVG(IF(rows_examined > 0, rows_sent/rows_examined, 0)) * 100 AS efficiency_pct
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND rows_examined > 1000
    AND rows_sent / rows_examined < 0.01  -- 效率低于1%
    GROUP BY sql_text
    ORDER BY avg_rows_examined DESC
    LIMIT 20;
    
    -- 生成EXPLAIN命令
    SELECT CONCAT('EXPLAIN FORMAT=JSON ', sql_text) AS explain_cmd
    FROM (
        SELECT 
            sql_text,
            AVG(rows_examined) AS avg_scan
        FROM proc_analysis_results
        WHERE session_id = p_session_id
        AND rows_examined > 1000
        AND rows_sent / rows_examined < 0.01
        GROUP BY sql_text
        ORDER BY avg_scan DESC
        LIMIT 10
    ) AS problem_queries;
END //

DELIMITER ;
```

### 完整实施步骤

1. **准备Java测试程序**

创建一个简单的Java程序，专门用于执行您想分析的存储过程：

```java
import java.sql.*;
import java.util.Properties;

public class StoredProcAnalyzer {
    
    private static final String DB_URL = "jdbc:mysql://localhost:3306/yourDatabase";
    private static final String USER = "yourUsername";
    private static final String PASS = "yourPassword";
    private static final String ANALYSIS_ID = "ANALYSIS_" + System.currentTimeMillis();
    
    public static void main(String[] args) {
        try {
            // 设置连接属性
            Properties props = new Properties();
            props.setProperty("user", USER);
            props.setProperty("password", PASS);
            props.setProperty("connectionAttributes", 
                             "program_name=INDEX_ANALYSIS_TOOL,analysis_id=" + ANALYSIS_ID);
            
            // 创建连接
            Connection conn = DriverManager.getConnection(DB_URL, props);
            
            // 在MySQL中注册本次分析会话
            registerAnalysisSession(conn);
            
            // 执行您想分析的存储过程
            executeProc(conn, "your_proc_name1", "param1", 123);
            executeProc(conn, "your_proc_name2", "param2", 456);
            // 可以添加更多存储过程...
            
            // 生成报告
            generateReport(conn);
            
            // 关闭连接
            conn.close();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
    
    private static void registerAnalysisSession(Connection conn) throws SQLException {
        PreparedStatement stmt = conn.prepareStatement(
            "INSERT INTO analysis_sessions (session_id, connection_id, description) " +
            "VALUES (?, CONNECTION_ID(), 'Java客户端触发的分析')");
        stmt.setString(1, ANALYSIS_ID);
        stmt.executeUpdate();
        stmt.close();
    }
    
    private static void executeProc(Connection conn, String procName, 
                                   String param1, int param2) throws SQLException {
        CallableStatement stmt = conn.prepareCall(
            "{CALL " + procName + "(?, ?)} /* INDEX_ANALYSIS_CLIENT */");
        stmt.setString(1, param1);
        stmt.setInt(2, param2);
        
        System.out.println("执行存储过程: " + procName);
        stmt.execute();
        stmt.close();
        
        // 给performance_schema时间记录数据
        try {
            Thread.sleep(500);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
    
    private static void generateReport(Connection conn) throws SQLException {
        CallableStatement stmt = conn.prepareCall("{CALL generate_analysis_report(?)}");
        stmt.setString(1, ANALYSIS_ID);
        
        boolean hasResults = stmt.execute();
        if (hasResults) {
            ResultSet rs = stmt.getResultSet();
            printResultSet("存储过程分析统计", rs);
            
            while (stmt.getMoreResults()) {
                rs = stmt.getResultSet();
                printResultSet("问题SQL分析", rs);
            }
        }
        
        stmt.close();
    }
    
    private static void printResultSet(String title, ResultSet rs) throws SQLException {
        System.out.println("\n=== " + title + " ===");
        
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();
        
        // 打印列名
        for (int i = 1; i <= columnCount; i++) {
            System.out.print(metaData.getColumnName(i) + "\t");
        }
        System.out.println();
        
        // 打印数据
        while (rs.next()) {
            for (int i = 1; i <= columnCount; i++) {
                System.out.print(rs.getString(i) + "\t");
            }
            System.out.println();
        }
    }
}
```

2. **在MySQL中创建必要的表和存储过程**

在MySQL中执行上面提供的SQL脚本创建:
- analysis_sessions表
- proc_analysis_results表
- capture_analysis_statements事件
- generate_analysis_report存储过程

3. **执行分析**

编译并运行Java程序:
```
javac StoredProcAnalyzer.java
java StoredProcAnalyzer
```

4. **查看报告**

程序会自动生成并打印报告，或者您可以手动查询:

```sql
-- 查看分析会话
SELECT * FROM analysis_sessions ORDER BY start_time DESC LIMIT 10;

-- 选择最近的一个会话ID
SET @recent_session = (SELECT session_id FROM analysis_sessions ORDER BY start_time DESC LIMIT 1);

-- 生成该会话的报告
CALL generate_analysis_report(@recent_session);
```

### 优点和注意事项

**优点:**
1. 完全隔离 - 只捕获您的Java测试程序触发的存储过程
2. 可重复 - 可以多次运行，测试不同参数
3. 真实模拟 - 通过Java程序调用更接近生产环境
4. 简单实施 - 修改极小，主要通过MySQL端配置完成

**注意事项:**
1. Performance Schema需要有足够的历史记录空间
2. 可能需要适当调整MySQL内存设置
3. 对于非常复杂的存储过程，可能需要调整事件的频率
4. 在低负载时段运行以避免影响正常业务

这种方法不需要您手动运行每个存储过程，而是通过Java程序自动执行并收集数据，同时通过特定标记确保只分析您想要的执行实例，不会与其他程序混淆。

## Prompt:
这样我调用这个代码，能顺序捕获到所有我这个java程序触发的存储过程吗？还有我想知道如何配置只有这个java触发的都捕获，以及这个java触发的部分存储过程捕获，方便我批量和单个去分析问题

## Response:
 您的问题非常清晰。让我详细解答如何配置Java程序和MySQL来实现不同级别的存储过程捕获：

## 调用Java代码能否顺序捕获所有触发的存储过程？

是的，通过正确配置，您可以顺序捕获到该Java程序触发的所有存储过程，包括嵌套调用的存储过程。Performance Schema能够跟踪完整的调用链，包括存储过程中调用的其他存储过程。

## 配置方案：三个级别的捕获控制

我将为您提供三个级别的捕获控制方案：

### 1. 全局捕获 - 专门捕获特定Java程序触发的所有存储过程

首先修改Java程序，添加明确的识别标记：

```java
// 在连接属性中添加唯一标识
Properties props = new Properties();
props.setProperty("user", USER);
props.setProperty("password", PASS);
// 关键部分：添加唯一标识符
props.setProperty("connectionAttributes", 
                 "program_name=INDEX_ANALYZER,analysis_id=" + ANALYSIS_ID);

Connection conn = DriverManager.getConnection(DB_URL, props);
```

然后在MySQL中设置过滤器：

```sql
-- 创建捕获函数
DELIMITER //

CREATE PROCEDURE start_analysis_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions (session_id, connection_id, description)
    VALUES (p_analysis_id, CONNECTION_ID(), '全局捕获');
    
    -- 启用Performance Schema适当设置
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%' OR NAME LIKE '%stages%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
    
    -- 清空历史表，准备捕获新数据
    TRUNCATE TABLE performance_schema.events_statements_history_long;
    
    -- 设置会话变量记录开始时间
    SET @capture_start_time = NOW();
END //

CREATE PROCEDURE stop_analysis_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集执行数据
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, 
        parent_proc, call_depth, connection_id
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        NESTING_EVENT_ID AS parent_proc,
        NESTING_EVENT_TYPE AS call_depth,
        THREAD_ID AS connection_id
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time;
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
END //

DELIMITER ;
```

### 2. 选择性捕获 - 捕获特定存储过程及其嵌套调用

修改Java程序，添加选择性捕获功能：

```java
public void captureSpecificProc(String procName, Object... params) throws SQLException {
    // 开始捕获
    CallableStatement startCapture = conn.prepareCall("{CALL start_specific_capture(?, ?)}");
    startCapture.setString(1, ANALYSIS_ID);
    startCapture.setString(2, procName);
    startCapture.execute();
    startCapture.close();
    
    try {
        // 准备存储过程调用
        StringBuilder callStr = new StringBuilder("{CALL " + procName + "(");
        for (int i = 0; i < params.length; i++) {
            callStr.append(i == 0 ? "?" : ",?");
        }
        callStr.append(")}");
        
        CallableStatement procCall = conn.prepareCall(callStr.toString());
        
        // 设置参数
        for (int i = 0; i < params.length; i++) {
            procCall.setObject(i + 1, params[i]);
        }
        
        // 执行存储过程
        procCall.execute();
        procCall.close();
    } finally {
        // 结束捕获
        CallableStatement endCapture = conn.prepareCall("{CALL stop_specific_capture(?)}");
        endCapture.setString(1, ANALYSIS_ID);
        endCapture.execute();
        endCapture.close();
    }
}
```

在MySQL中设置对应的存储过程：

```sql
DELIMITER //

CREATE PROCEDURE start_specific_capture(
    IN p_analysis_id VARCHAR(100),
    IN p_proc_name VARCHAR(255)
)
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions 
    (session_id, connection_id, description, target_proc)
    VALUES (p_analysis_id, CONNECTION_ID(), '特定过程捕获', p_proc_name);
    
    -- 设置捕获标志和时间
    SET @specific_capture = p_proc_name;
    SET @capture_start_time = NOW();
    
    -- 启用必要的Performance Schema设置
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
    
    -- 清空历史表准备新数据
    TRUNCATE TABLE performance_schema.events_statements_history_long;
END //

CREATE PROCEDURE stop_specific_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集执行数据
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, 
        parent_proc, call_depth, target_proc
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        NESTING_EVENT_ID,
        NESTING_EVENT_TYPE,
        @specific_capture
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time;
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
    
    -- 清除捕获标志
    SET @specific_capture = NULL;
END //

DELIMITER ;
```

### 3. SQL过滤器模式 - 捕获特定SQL模式的执行

创建一个可以过滤特定SQL模式的分析功能：

```java
public void captureWithSqlFilter(String sqlPattern) throws SQLException {
    // 开始带过滤器的捕获
    CallableStatement startCapture = conn.prepareCall(
        "{CALL start_filtered_capture(?, ?)}");
    startCapture.setString(1, ANALYSIS_ID);
    startCapture.setString(2, sqlPattern);
    startCapture.execute();
    startCapture.close();
    
    // 注: 此时您执行常规业务逻辑，触发各种存储过程
    
    // 在完成后停止捕获
    CallableStatement endCapture = conn.prepareCall(
        "{CALL stop_filtered_capture(?)}");
    endCapture.setString(1, ANALYSIS_ID);
    endCapture.execute();
    endCapture.close();
}
```

对应的MySQL存储过程：

```sql
DELIMITER //

CREATE PROCEDURE start_filtered_capture(
    IN p_analysis_id VARCHAR(100),
    IN p_sql_pattern VARCHAR(255)
)
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions 
    (session_id, connection_id, description, sql_filter)
    VALUES (p_analysis_id, CONNECTION_ID(), 'SQL过滤器模式', p_sql_pattern);
    
    -- 设置捕获标志
    SET @sql_filter = p_sql_pattern;
    SET @capture_start_time = NOW();
    
    -- 配置Performance Schema
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
END //

CREATE PROCEDURE stop_filtered_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集匹配的SQL
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, sql_filter
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        @sql_filter
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time
    AND SQL_TEXT LIKE CONCAT('%', @sql_filter, '%');
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
    
    -- 清除捕获标志
    SET @sql_filter = NULL;
END //

DELIMITER ;
```

## 完整工具示例

下面是一个完整的Java程序示例，集成了上述所有功能：

```java
import java.sql.*;
import java.util.*;

public class StoredProcIndexAnalyzer {
    
    private static final String DB_URL = "jdbc:mysql://localhost:3306/yourDatabase";
    private static final String USER = "yourUsername";
    private static final String PASS = "yourPassword";
    private static final String ANALYSIS_ID = "ANALYSIS_" + System.currentTimeMillis();
    
    private Connection conn;
    
    public StoredProcIndexAnalyzer() throws SQLException {
        // 设置连接属性
        Properties props = new Properties();
        props.setProperty("user", USER);
        props.setProperty("password", PASS);
        props.setProperty("connectionAttributes", 
                         "program_name=INDEX_ANALYZER,analysis_id=" + ANALYSIS_ID);
        
        // 创建连接
        conn = DriverManager.getConnection(DB_URL, props);
        System.out.println("连接已建立，分析ID: " + ANALYSIS_ID);
    }
    
    public void close() throws SQLException {
        if (conn != null && !conn.isClosed()) {
            conn.close();
            System.out.println("连接已关闭");
        }
    }
    
    // 分析模式1: 全局捕获所有调用
    public void captureAllProcs() throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_analysis_capture(?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始全局捕获...");
        
        // 在这里执行所有需要分析的存储过程
        // 例如：
        // executeProc("proc1", "param1", 123);
        // executeProc("proc2", "param2", 456);
        
        CallableStatement stopStmt = conn.prepareCall("{CALL stop_analysis_capture(?)}");
        stopStmt.setString(1, ANALYSIS_ID);
        stopStmt.execute();
        stopStmt.close();
        
        System.out.println("全局捕获完成");
    }
    
    // 分析模式2: 捕获特定存储过程
    public void captureSpecificProc(String procName, Object... params) throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_specific_capture(?, ?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.setString(2, procName);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始捕获特定存储过程: " + procName);
        
        try {
            executeProc(procName, params);
        } finally {
            CallableStatement stopStmt = conn.prepareCall("{CALL stop_specific_capture(?)}");
            stopStmt.setString(1, ANALYSIS_ID);
            stopStmt.execute();
            stopStmt.close();
            
            System.out.println("特定存储过程捕获完成");
        }
    }
    
    // 分析模式3: SQL过滤器模式
    public void captureWithSqlFilter(String sqlPattern) throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_filtered_capture(?, ?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.setString(2, sqlPattern);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始SQL过滤模式捕获，过滤器: " + sqlPattern);
        
        // 执行业务逻辑...
        
        CallableStatement stopStmt = conn.prepareCall("{CALL stop_filtered_capture(?)}");
        stopStmt.setString(1, ANALYSIS_ID);
        stopStmt.execute();
        stopStmt.close();
        
        System.out.println("SQL过滤模式捕获完成");
    }
    
    // 分析模式4: 批量分析多个存储过程
    public void batchAnalyzeProcs(List<String> procNames) throws SQLException {
        System.out.println("开始批量分析 " + procNames.size() + " 个存储过程...");
        
        for (String procName : procNames) {
            try {
                captureSpecificProc(procName);
                System.out.println("完成: " + procName);
            } catch (SQLException e) {
                System.err.println("处理 " + procName + " 时出错: " + e.getMessage());
            }
        }
        
        System.out.println("批量分析完成");
    }
    
    // 执行存储过程的辅助方法
    private void executeProc(String procName, Object... params) throws SQLException {
        // 构建调用字符串
        StringBuilder callStmt = new StringBuilder("{CALL " + procName + "(");
        for (int i = 0; i < params.length; i++) {
            callStmt.append(i == 0 ? "?" : ",?");
        }
        callStmt.append(")}");
        
        CallableStatement stmt = conn.prepareCall(callStmt.toString());
        
        // 设置参数
        for (int i = 0; i < params.length; i++) {
            stmt.setObject(i + 1, params[i]);
        }
        
        // 执行
        stmt.execute();
        stmt.close();
    }
    
    // 生成分析报告
    public void generateReport() throws SQLException {
        CallableStatement stmt = conn.prepareCall("{CALL generate_analysis_report(?)}");
        stmt.setString(1, ANALYSIS_ID);
        
        boolean hasResults = stmt.execute();
        while (hasResults) {
            ResultSet rs = stmt.getResultSet();
            printResultSet(rs);
            hasResults = stmt.getMoreResults();
        }
        
        stmt.close();
    }
    
    // 获取存储过程列表辅助方法
    public List<String> getProcedureList() throws SQLException {
        List<String> procList = new ArrayList<>();
        
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(
            "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES " +
            "WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' " +
            "ORDER BY ROUTINE_NAME");
        
        while (rs.next()) {
            procList.add(rs.getString("ROUTINE_NAME"));
        }
        
        rs.close();
        stmt.close();
        
        return procList;
    }
    
    // 打印结果集辅助方法
    private void printResultSet(ResultSet rs) throws SQLException {
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();
        
        // 打印列名
        for (int i = 1; i <= columnCount; i++) {
            System.out.print(metaData.getColumnName(i) + "\t");
        }
        System.out.println();
        
        // 打印分隔符
        for (int i = 1; i <= columnCount; i++) {
            System.out.print("----------\t");
        }
        System.out.println();
        
        // 打印数据
        while (rs.next()) {
            for (int i = 1; i <= columnCount; i++) {
                System.out.print(rs.getString(i) + "\t");
            }
            System.out.println();
        }
        
        System.out.println("\n");
    }
    
    // 主方法示例
    public static void main(String[] args) {
        try {
            StoredProcIndexAnalyzer analyzer = new StoredProcIndexAnalyzer();
            
            // 示例1: 分析单个存储过程
            analyzer.captureSpecificProc("your_problematic_proc", "param1", 123);
            
            // 示例2: SQL过滤模式
            // analyzer.captureWithSqlFilter("WHERE col_name =");
            
            // 示例3: 批量分析前10个存储过程
            // List<String> procs = analyzer.getProcedureList();
            // analyzer.batchAnalyzeProcs(procs.subList(0, Math.min(10, procs.size())));
            
            // 生成报告
            analyzer.generateReport();
            
            // 关闭连接
            analyzer.close();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

## 在MySQL端创建分析报告生成器

```sql
DELIMITER //

CREATE PROCEDURE generate_analysis_report(IN p_session_id VARCHAR(100))
BEGIN
    -- 报告1: 总体统计
    SELECT 
        'Overall Statistics' AS report_type,
        COUNT(DISTINCT proc_name) AS total_procs_analyzed,
        COUNT(DISTINCT sql_text) AS unique_sql_statements,
        SUM(IF(rows_examined > 1000, 1, 0)) AS high_scan_count,
        SUM(IF(rows_examined > 0 AND rows_sent/rows_examined < 0.01, 1, 0)) AS low_efficiency_count
    FROM proc_analysis_results
    WHERE session_id = p_session_id;
    
    -- 报告2: 存储过程分析
    SELECT 
        'Procedure Analysis' AS report_type,
        proc_name,
        COUNT(*) AS call_count,
        SUM(rows_examined) AS total_rows_examined,
        SUM(rows_sent) AS total_rows_sent,
        ROUND(AVG(rows_sent/IF(rows_examined=0, 1, rows_examined))*100, 2) AS avg_efficiency_pct,
        MAX(rows_examined) AS max_rows_examined,
        SUM(execution_time)/1000000000 AS total_execution_time_sec
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND proc_name != ''
    GROUP BY proc_name
    ORDER BY avg_efficiency_pct ASC, total_rows_examined DESC;
    
    -- 报告3: 索引效率分析
    SELECT 
        'Index Efficiency Analysis' AS report_type,
        sql_text,
        COUNT(*) AS execution_count,
        AVG(rows_examined) AS avg_rows_examined,
        AVG(rows_sent) AS avg_rows_sent,
        ROUND(AVG(rows_sent/IF(rows_examined=0, 1, rows_examined))*100, 2) AS efficiency_pct,
        AVG(execution_time)/1000000 AS avg_exec_time_ms,
        IF(efficiency_pct < 1, 'Critical', 
           IF(efficiency_pct < 5, 'Warning', 
              IF(efficiency_pct < 20, 'Suboptimal', 'Good'))) AS efficiency_rating
    FROM (
        SELECT 
            sql_text,
            rows_examined,
            rows_sent,
            execution_time,
            (rows_sent/IF(rows_examined=0, 1, rows_examined))*100 AS efficiency_pct
        FROM proc_analysis_results
        WHERE session_id = p_session_id
        AND sql_text NOT LIKE 'CALL %'
        AND sql_text NOT LIKE 'SET %'
        AND rows_examined > 100
    ) AS filtered_results
    GROUP BY sql_text
    HAVING efficiency_pct < 20
    ORDER BY efficiency_pct ASC, avg_rows_examined DESC
    LIMIT 20;
    
    -- 报告4: 需要EXPLAIN分析的SQL
    SELECT 
        'SQLs Requiring EXPLAIN' AS report_type,
        CONCAT('EXPLAIN FORMAT=JSON ', sql_text, ';') AS explain_command
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND rows_examined > 1000
    AND rows_sent/IF(rows_examined=0, 1, rows_examined) < 0.01
    GROUP BY sql_text
    ORDER BY rows_examined DESC
    LIMIT 10;
    
    -- 报告5: 嵌套存储过程分析
    SELECT 
        'Nested Procedure Analysis' AS report_type,
        p1.proc_name AS parent_proc,
        p2.proc_name AS child_proc,
        COUNT(*) AS call_count,
        SUM(p2.rows_examined) AS total_rows_examined
    FROM proc_analysis_results p1
    JOIN proc_analysis_results p2 ON p1.nesting_event_id = p2.parent_proc
    WHERE p1.session_id = p_session_id
    AND p2.session_id = p_session_id
    AND p1.proc_name != ''
    AND p2.proc_name != ''
    GROUP BY p1.proc_name, p2.proc_name
    ORDER BY total_rows_examined DESC
    LIMIT 20;
END //

DELIMITER ;
```

## 使用说明

1. **选择分析模式**：
   - 全局模式：适合分析所有存储过程，包括复杂的嵌套调用
   - 特定过程模式：精确分析某个问题存储过程
   - SQL过滤模式：针对特定SQL模式进行分析
   - 批量分析模式：对多个存储过程进行批量分析

2. **如何使用**：
   - 修改Java示例中的数据库连接信息
   - 取消注释相应的分析模式
   - 添加要分析的实际存储过程调用
   - 运行程序即可获取分析结果

3. **结果解读**：
   - 效率百分比(efficiency_pct)：返回行数占检查行数的百分比，越低说明索引效率越差
   - 扫描行数(rows_examined)：查询扫描的总行数，数值大说明可能需要优化索引
   - 执行时间(execution_time)：执行所需时间，单位为微秒

通过这种方法，您可以：
1. 仅捕获您的Java程序触发的存储过程
2. 根据需要选择性地分析部分存储过程
3. 针对特定SQL模式进行深入分析
4. 查看嵌套存储过程的层级关系

这套工具完全适用于MySQL 5.7社区版，不需要修改存储过程源代码，同时提供了非常灵活的分析选项。

## Prompt:
请总结我的以上需求和你的解决方案生成一份详实的文档操作说明，告诉我这样一个初学者如何一步步去实现这些。

## Response:
 # MySQL存储过程动态SQL索引效率分析工具

## 需求概述

您需要一个工具，可以分析MySQL存储过程中动态SQL的索引效率，但有以下特殊要求：

1. 不修改存储过程的源代码
2. 能够分析多层嵌套的存储过程(约400个)
3. 能够捕获由特定Java程序触发的存储过程执行
4. 能够选择性分析部分存储过程
5. 适用于MySQL 5.7社区版

## 解决方案

我们设计了一套基于Performance Schema的分析工具，由Java端和MySQL端两部分组成，可以捕获和分析存储过程中的动态SQL索引效率。

## 详细实施步骤

### 第一步：MySQL端配置和准备

#### 1.1 创建必要的数据表

```sql
-- 创建存储分析会话的表
CREATE TABLE analysis_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    connection_id INT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    description VARCHAR(255),
    target_proc VARCHAR(255) NULL,
    sql_filter VARCHAR(255) NULL
);

-- 创建存储分析结果的表
CREATE TABLE proc_analysis_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100),
    proc_name VARCHAR(255),
    sql_text LONGTEXT,
    rows_examined BIGINT,
    rows_sent BIGINT,
    execution_time BIGINT,
    execution_timestamp TIMESTAMP,
    parent_proc INT NULL,
    call_depth VARCHAR(50) NULL,
    connection_id INT NULL,
    target_proc VARCHAR(255) NULL,
    sql_filter VARCHAR(255) NULL
);
```

#### 1.2 创建分析工具存储过程

```sql
DELIMITER //

-- 全局捕获模式的开始和结束过程
CREATE PROCEDURE start_analysis_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions (session_id, connection_id, description)
    VALUES (p_analysis_id, CONNECTION_ID(), '全局捕获');
    
    -- 启用Performance Schema适当设置
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%' OR NAME LIKE '%stages%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
    
    -- 清空历史表，准备捕获新数据
    TRUNCATE TABLE performance_schema.events_statements_history_long;
    
    -- 设置会话变量记录开始时间
    SET @capture_start_time = NOW();
END //

CREATE PROCEDURE stop_analysis_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集执行数据
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, 
        parent_proc, call_depth, connection_id
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        NESTING_EVENT_ID AS parent_proc,
        NESTING_EVENT_TYPE AS call_depth,
        THREAD_ID AS connection_id
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time;
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
END //

-- 特定存储过程捕获模式
CREATE PROCEDURE start_specific_capture(
    IN p_analysis_id VARCHAR(100),
    IN p_proc_name VARCHAR(255)
)
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions 
    (session_id, connection_id, description, target_proc)
    VALUES (p_analysis_id, CONNECTION_ID(), '特定过程捕获', p_proc_name);
    
    -- 设置捕获标志和时间
    SET @specific_capture = p_proc_name;
    SET @capture_start_time = NOW();
    
    -- 启用必要的Performance Schema设置
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
    
    -- 清空历史表准备新数据
    TRUNCATE TABLE performance_schema.events_statements_history_long;
END //

CREATE PROCEDURE stop_specific_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集执行数据
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, 
        parent_proc, call_depth, target_proc
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        NESTING_EVENT_ID,
        NESTING_EVENT_TYPE,
        @specific_capture
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time;
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
    
    -- 清除捕获标志
    SET @specific_capture = NULL;
END //

-- SQL过滤器模式
CREATE PROCEDURE start_filtered_capture(
    IN p_analysis_id VARCHAR(100),
    IN p_sql_pattern VARCHAR(255)
)
BEGIN
    -- 记录分析会话
    INSERT INTO analysis_sessions 
    (session_id, connection_id, description, sql_filter)
    VALUES (p_analysis_id, CONNECTION_ID(), 'SQL过滤器模式', p_sql_pattern);
    
    -- 设置捕获标志
    SET @sql_filter = p_sql_pattern;
    SET @capture_start_time = NOW();
    
    -- 配置Performance Schema
    UPDATE performance_schema.setup_consumers
    SET ENABLED = 'YES'
    WHERE NAME LIKE '%statements%';
    
    UPDATE performance_schema.setup_instruments
    SET ENABLED = 'YES', TIMED = 'YES'
    WHERE NAME LIKE 'statement/sp/%' OR NAME LIKE 'statement/sql/%';
END //

CREATE PROCEDURE stop_filtered_capture(IN p_analysis_id VARCHAR(100))
BEGIN
    -- 收集匹配的SQL
    INSERT INTO proc_analysis_results (
        session_id, proc_name, sql_text, rows_examined, 
        rows_sent, execution_time, execution_timestamp, sql_filter
    )
    SELECT 
        p_analysis_id,
        IF(SQL_TEXT LIKE 'CALL %', 
           TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(SQL_TEXT, 'CALL ', -1), '(', 1)),
           '') AS proc_name,
        SQL_TEXT,
        ROWS_EXAMINED,
        ROWS_SENT,
        TIMER_WAIT,
        EVENT_TIME,
        @sql_filter
    FROM performance_schema.events_statements_history_long
    WHERE THREAD_ID = CONNECTION_ID()
    AND EVENT_TIME >= @capture_start_time
    AND SQL_TEXT LIKE CONCAT('%', @sql_filter, '%');
    
    -- 标记会话结束
    UPDATE analysis_sessions
    SET end_time = NOW()
    WHERE session_id = p_analysis_id
    AND connection_id = CONNECTION_ID();
    
    -- 清除捕获标志
    SET @sql_filter = NULL;
END //

-- 分析报告生成器
CREATE PROCEDURE generate_analysis_report(IN p_session_id VARCHAR(100))
BEGIN
    -- 报告1: 总体统计
    SELECT 
        'Overall Statistics' AS report_type,
        COUNT(DISTINCT proc_name) AS total_procs_analyzed,
        COUNT(DISTINCT sql_text) AS unique_sql_statements,
        SUM(IF(rows_examined > 1000, 1, 0)) AS high_scan_count,
        SUM(IF(rows_examined > 0 AND rows_sent/rows_examined < 0.01, 1, 0)) AS low_efficiency_count
    FROM proc_analysis_results
    WHERE session_id = p_session_id;
    
    -- 报告2: 存储过程分析
    SELECT 
        'Procedure Analysis' AS report_type,
        proc_name,
        COUNT(*) AS call_count,
        SUM(rows_examined) AS total_rows_examined,
        SUM(rows_sent) AS total_rows_sent,
        ROUND(AVG(rows_sent/IF(rows_examined=0, 1, rows_examined))*100, 2) AS avg_efficiency_pct,
        MAX(rows_examined) AS max_rows_examined,
        SUM(execution_time)/1000000000 AS total_execution_time_sec
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND proc_name != ''
    GROUP BY proc_name
    ORDER BY avg_efficiency_pct ASC, total_rows_examined DESC;
    
    -- 报告3: 索引效率分析
    SELECT 
        'Index Efficiency Analysis' AS report_type,
        sql_text,
        COUNT(*) AS execution_count,
        AVG(rows_examined) AS avg_rows_examined,
        AVG(rows_sent) AS avg_rows_sent,
        ROUND(AVG(rows_sent/IF(rows_examined=0, 1, rows_examined))*100, 2) AS efficiency_pct,
        AVG(execution_time)/1000000 AS avg_exec_time_ms,
        IF(efficiency_pct < 1, 'Critical', 
           IF(efficiency_pct < 5, 'Warning', 
              IF(efficiency_pct < 20, 'Suboptimal', 'Good'))) AS efficiency_rating
    FROM (
        SELECT 
            sql_text,
            rows_examined,
            rows_sent,
            execution_time,
            (rows_sent/IF(rows_examined=0, 1, rows_examined))*100 AS efficiency_pct
        FROM proc_analysis_results
        WHERE session_id = p_session_id
        AND sql_text NOT LIKE 'CALL %'
        AND sql_text NOT LIKE 'SET %'
        AND rows_examined > 100
    ) AS filtered_results
    GROUP BY sql_text
    HAVING efficiency_pct < 20
    ORDER BY efficiency_pct ASC, avg_rows_examined DESC
    LIMIT 20;
    
    -- 报告4: 需要EXPLAIN分析的SQL
    SELECT 
        'SQLs Requiring EXPLAIN' AS report_type,
        CONCAT('EXPLAIN FORMAT=JSON ', sql_text, ';') AS explain_command
    FROM proc_analysis_results
    WHERE session_id = p_session_id
    AND rows_examined > 1000
    AND rows_sent/IF(rows_examined=0, 1, rows_examined) < 0.01
    GROUP BY sql_text
    ORDER BY rows_examined DESC
    LIMIT 10;
    
    -- 报告5: 嵌套存储过程分析
    SELECT 
        'Nested Procedure Analysis' AS report_type,
        p1.proc_name AS parent_proc,
        p2.proc_name AS child_proc,
        COUNT(*) AS call_count,
        SUM(p2.rows_examined) AS total_rows_examined
    FROM proc_analysis_results p1
    JOIN proc_analysis_results p2 ON p1.nesting_event_id = p2.parent_proc
    WHERE p1.session_id = p_session_id
    AND p2.session_id = p_session_id
    AND p1.proc_name != ''
    AND p2.proc_name != ''
    GROUP BY p1.proc_name, p2.proc_name
    ORDER BY total_rows_examined DESC
    LIMIT 20;
END //

DELIMITER ;
```

#### 1.3 确保Performance Schema已启用

检查MySQL是否已启用Performance Schema：

```sql
SHOW VARIABLES LIKE 'performance_schema';
```

如果返回值为OFF，需在my.cnf配置文件中添加：

```
[mysqld]
performance_schema=ON
```

然后重启MySQL服务。

### 第二步：创建Java分析工具

#### 2.1 创建Java项目

创建一个名为"StoredProcIndexAnalyzer"的Java项目，添加以下依赖：

- MySQL JDBC驱动：mysql-connector-java (8.0.x或5.1.x版本)

#### 2.2 创建主分析类

创建`StoredProcIndexAnalyzer.java`文件：

```java
import java.sql.*;
import java.util.*;

public class StoredProcIndexAnalyzer {
    
    private static final String DB_URL = "jdbc:mysql://localhost:3306/yourDatabase";
    private static final String USER = "yourUsername";
    private static final String PASS = "yourPassword";
    private static final String ANALYSIS_ID = "ANALYSIS_" + System.currentTimeMillis();
    
    private Connection conn;
    
    public StoredProcIndexAnalyzer() throws SQLException {
        // 设置连接属性
        Properties props = new Properties();
        props.setProperty("user", USER);
        props.setProperty("password", PASS);
        props.setProperty("connectionAttributes", 
                         "program_name=INDEX_ANALYZER,analysis_id=" + ANALYSIS_ID);
        
        // 创建连接
        conn = DriverManager.getConnection(DB_URL, props);
        System.out.println("连接已建立，分析ID: " + ANALYSIS_ID);
    }
    
    public void close() throws SQLException {
        if (conn != null && !conn.isClosed()) {
            conn.close();
            System.out.println("连接已关闭");
        }
    }
    
    // 分析模式1: 全局捕获所有调用
    public void captureAllProcs() throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_analysis_capture(?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始全局捕获...");
        
        // 在这里执行所有需要分析的存储过程
        // 例如：
        // executeProc("proc1", "param1", 123);
        // executeProc("proc2", "param2", 456);
        
        CallableStatement stopStmt = conn.prepareCall("{CALL stop_analysis_capture(?)}");
        stopStmt.setString(1, ANALYSIS_ID);
        stopStmt.execute();
        stopStmt.close();
        
        System.out.println("全局捕获完成");
    }
    
    // 分析模式2: 捕获特定存储过程
    public void captureSpecificProc(String procName, Object... params) throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_specific_capture(?, ?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.setString(2, procName);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始捕获特定存储过程: " + procName);
        
        try {
            executeProc(procName, params);
        } finally {
            CallableStatement stopStmt = conn.prepareCall("{CALL stop_specific_capture(?)}");
            stopStmt.setString(1, ANALYSIS_ID);
            stopStmt.execute();
            stopStmt.close();
            
            System.out.println("特定存储过程捕获完成");
        }
    }
    
    // 分析模式3: SQL过滤器模式
    public void captureWithSqlFilter(String sqlPattern) throws SQLException {
        CallableStatement startStmt = conn.prepareCall("{CALL start_filtered_capture(?, ?)}");
        startStmt.setString(1, ANALYSIS_ID);
        startStmt.setString(2, sqlPattern);
        startStmt.execute();
        startStmt.close();
        
        System.out.println("开始SQL过滤模式捕获，过滤器: " + sqlPattern);
        
        // 执行业务逻辑...
        
        CallableStatement stopStmt = conn.prepareCall("{CALL stop_filtered_capture(?)}");
        stopStmt.setString(1, ANALYSIS_ID);
        stopStmt.execute();
        stopStmt.close();
        
        System.out.println("SQL过滤模式捕获完成");
    }
    
    // 分析模式4: 批量分析多个存储过程
    public void batchAnalyzeProcs(List<String> procNames) throws SQLException {
        System.out.println("开始批量分析 " + procNames.size() + " 个存储过程...");
        
        for (String procName : procNames) {
            try {
                captureSpecificProc(procName);
                System.out.println("完成: " + procName);
            } catch (SQLException e) {
                System.err.println("处理 " + procName + " 时出错: " + e.getMessage());
            }
        }
        
        System.out.println("批量分析完成");
    }
    
    // 执行存储过程的辅助方法
    private void executeProc(String procName, Object... params) throws SQLException {
        // 构建调用字符串
        StringBuilder callStmt = new StringBuilder("{CALL " + procName + "(");
        for (int i = 0; i < params.length; i++) {
            callStmt.append(i == 0 ? "?" : ",?");
        }
        callStmt.append(")}");
        
        CallableStatement stmt = conn.prepareCall(callStmt.toString());
        
        // 设置参数
        for (int i = 0; i < params.length; i++) {
            stmt.setObject(i + 1, params[i]);
        }
        
        // 执行
        stmt.execute();
        stmt.close();
    }
    
    // 生成分析报告
    public void generateReport() throws SQLException {
        CallableStatement stmt = conn.prepareCall("{CALL generate_analysis_report(?)}");
        stmt.setString(1, ANALYSIS_ID);
        
        boolean hasResults = stmt.execute();
        while (hasResults) {
            ResultSet rs = stmt.getResultSet();
            printResultSet(rs);
            hasResults = stmt.getMoreResults();
        }
        
        stmt.close();
    }
    
    // 获取存储过程列表辅助方法
    public List<String> getProcedureList() throws SQLException {
        List<String> procList = new ArrayList<>();
        
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(
            "SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES " +
            "WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_TYPE = 'PROCEDURE' " +
            "ORDER BY ROUTINE_NAME");
        
        while (rs.next()) {
            procList.add(rs.getString("ROUTINE_NAME"));
        }
        
        rs.close();
        stmt.close();
        
        return procList;
    }
    
    // 打印结果集辅助方法
    private void printResultSet(ResultSet rs) throws SQLException {
        ResultSetMetaData metaData = rs.getMetaData();
        int columnCount = metaData.getColumnCount();
        
        // 打印列名
        for (int i = 1; i <= columnCount; i++) {
            System.out.print(metaData.getColumnName(i) + "\t");
        }
        System.out.println();
        
        // 打印分隔符
        for (int i = 1; i <= columnCount; i++) {
            System.out.print("----------\t");
        }
        System.out.println();
        
        // 打印数据
        while (rs.next()) {
            for (int i = 1; i <= columnCount; i++) {
                System.out.print(rs.getString(i) + "\t");
            }
            System.out.println();
        }
        
        System.out.println("\n");
    }
    
    // 主方法示例
    public static void main(String[] args) {
        try {
            StoredProcIndexAnalyzer analyzer = new StoredProcIndexAnalyzer();
            
            // 示例1: 分析单个存储过程
            analyzer.captureSpecificProc("your_problematic_proc", "param1", 123);
            
            // 示例2: SQL过滤模式
            // analyzer.captureWithSqlFilter("WHERE col_name =");
            
            // 示例3: 批量分析前10个存储过程
            // List<String> procs = analyzer.getProcedureList();
            // analyzer.batchAnalyzeProcs(procs.subList(0, Math.min(10, procs.size())));
            
            // 生成报告
            analyzer.generateReport();
            
            // 关闭连接
            analyzer.close();
            
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### 第三步：使用分析工具

#### 3.1 配置和编译Java程序

1. 修改Java代码中的数据库连接信息：
   - `DB_URL`: 数据库连接URL
   - `USER`: 数据库用户名
   - `PASS`: 数据库密码

2. 编译Java程序：
   ```
   javac -cp mysql-connector-java-8.0.28.jar StoredProcIndexAnalyzer.java
   ```

#### 3.2 使用场景示例

##### 场景1: 分析单个有问题的存储过程

1. 修改Java代码的main方法：
   ```java
   // 分析单个存储过程
   analyzer.captureSpecificProc("problem_procedure_name", "paramValue1", 123);
   ```

2. 运行分析器：
   ```
   java -cp .:mysql-connector-java-8.0.28.jar StoredProcIndexAnalyzer
   ```

##### 场景2: 使用SQL模式分析特定SQL问题

1. 修改Java代码的main方法：
   ```java
   // 分析包含特定WHERE条件的SQL
   analyzer.captureWithSqlFilter("WHERE customer_id =");
   
   // 手动执行一些操作，触发存储过程
   analyzer.executeProc("proc1", "param1", 123);
   analyzer.executeProc("proc2", "param2", 456);
   
   // 停止捕获和生成报告
   analyzer.generateReport();
   ```

##### 场景3: 批量分析多个存储过程

1. 修改Java代码的main方法：
   ```java
   // 获取所有存储过程列表
   List<String> procs = analyzer.getProcedureList();
   
   // 分析前50个存储过程
   analyzer.batchAnalyzeProcs(procs.subList(0, Math.min(50, procs.size())));
   ```

#### 3.3 分析报告解读

分析报告包含5个部分：

1. **总体统计**
   - 分析的存储过程总数
   - 唯一SQL语句数量
   - 高扫描计数(扫描行数>1000的SQL数量)
   - 低效率计数(效率<1%的SQL数量)

2. **存储过程分析**
   - 按索引效率从低到高排序的存储过程列表
   - 每个存储过程的调用次数、扫描行数、返回行数、平均效率

3. **索引效率分析**
   - 索引效率低于20%的SQL语句
   - 这些SQL的平均扫描行数、平均返回行数、效率百分比
   - 效率评级(Critical/Warning/Suboptimal/Good)

4. **需要EXPLAIN分析的SQL**
   - 自动生成需要执行EXPLAIN的SQL命令
   - 这些SQL通常是扫描行数大、效率低的查询

5. **嵌套存储过程分析**
   - 存储过程之间的调用关系
   - 子存储过程的扫描行数统计

### 第四步：优化索引

根据分析报告，您可以进行以下优化：

1. 对于效率评级为"Critical"的SQL，立即添加或优化索引
2. 使用生成的EXPLAIN命令分析查询计划
3. 为扫描行数大的WHERE条件添加适当的索引
4. 对效率评级为"Warning"的SQL进行进一步分析
5. 检查嵌套存储过程中的性能瓶颈

## 常见问题解答

### Q1: 这种分析会影响生产环境吗？
A1: Performance Schema会消耗一定系统资源，建议在非高峰期或测试环境中执行分析。

### Q2: 如何处理需要特定参数的存储过程？
A2: 使用`captureSpecificProc`方法并传入所需参数，例如：
```java
analyzer.captureSpecificProc("your_proc", "param1", 123, "param3");
```

### Q3: 如何分析计划任务执行的存储过程？
A3: 可以通过SQL过滤器模式捕获特定存储过程执行：
```java
analyzer.captureWithSqlFilter("CALL your_scheduled_proc");
```

### Q4: 分析数据会保存多久？
A4: 数据保存在`proc_analysis_results`表中，直到您删除它们。您可以定期清理或归档这些数据。

### Q5: 如何提高分析准确性？
A5: 确保使用真实参数执行存储过程，使其行为与生产环境一致。

## 小结

本工具通过Performance Schema和Java程序的组合，实现了在不修改存储过程代码的情况下，对MySQL存储过程动态SQL的索引效率进行分析。它可以专门捕获特定Java程序触发的存储过程执行，并提供多种分析模式以满足不同需求。

通过使用本工具，即使是MySQL初学者也能够识别存储过程中的索引效率问题，并有针对性地进行优化。



---
Powered by [Claude Exporter](https://www.claudexporter.com)