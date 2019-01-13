var JEditor = function (painter) {
    this.painter = painter;
    this.painter.editor = this;

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_link = function (begin, end, style) {
        var id = ++ this.painter._id_pool;
        if ( typeof begin != 'object' ) {
            target = this.painter.search_anrchor(begin);
            if ( ! target ) {
                console.error("没有找到锚点", begin);
                return undefined;
            }
            begin = target;
        }
        if ( typeof end != 'object' ) {
            target = this.painter.search_anrchor(end);
            if ( ! target ) {
                console.error("没有找到锚点", end);
                return undefined;
            }
            end = target;
        }

        var link = new JLink(id, begin, end, style);
        this.painter.links_list[id] = link;
        return link;
    };

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_anchor = function (model, x_offset, y_offset, style) {
        var id = ++ this.painter._id_pool;
        if ( typeof model != 'object' ) {
            target = this.painter.search_model(model);
            if ( ! target ) {
                console.error("没有找到模型", model);
                return undefined;
            }
            model = target;
        }
        var archor = new JAnchor(id, model, x_offset, y_offset, style);
        this.painter.anchors_list[id] = archor;
        return archor;
    };

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_model = function(x_offset, y_offset, width, height, style) {
        var id = ++ this.painter._id_pool;
        var model = new JModel(id, this.painter, x_offset, y_offset, width, height, style);
        this.painter.models_list[id] = model;

        var left_anchors = this.create_anchor(model, -width/2, 0);
        var top_anchors = this.create_anchor(model, 0, -height/2);
        var right_anchors = this.create_anchor(model, width/2, 0);
        var bottom_anchors = this.create_anchor(model, 0, height/2);
        var center_anchors = this.create_anchor(model, 0, 0);

        return [model, left_anchors, top_anchors, right_anchors, bottom_anchors, center_anchors];
    };

    /**
     * 更新绘制的内容到画板
     * */
    this.update = function () {
        this.painter.begin();
        this.painter.render();
        this.painter.update();
    };
};
/**
 * 将画板中的对象保存起来
 * */
JEditor.prototype.save = function () {
    var models = [];
    var links = [];
    var anchors = [];

    for (i in this.painter.links_list) {
        links.push(this.painter.links_list[i].save())
    }

    for (i in this.painter.anchors_list) {
        anchors.push(this.painter.anchors_list[i].save())
    }

    for (i in this.painter.models_list) {
        models.push(this.painter.models_list[i].save())
    }

    var options = {
        models: models,
        links: links,
        anchors: anchors
    };

    var str = JSON.stringify(options);
    console.log(str);

    return options;
};

/**
 * 从json对象加载到画板
 * */
JEditor.prototype.load = function (obj) {
    this.painter.load(obj.models, obj.anchors, obj.links);
};

/**
 * 选择模型
 * */
JEditor.prototype.select_model = function (ev) {
    for ( id in this.painter.models_list ) {
        var model = this.painter.models_list[id];

        if ( model.x > ev.offsetX ) {
            continue;
        }
        if ( model.x + model.width < ev.offsetX ) {
            continue;
        }
        if ( model.y > ev.offsetY ) {
            continue;
        }
        if ( model.y + model.height < ev.offsetY ) {
            continue;
        }
        return model;
    }
};


/***
 *
 * 鼠标移动事件
 */
JEditor.prototype.onmousemove = function (ev) {
    var model = this.select_model(ev);
    if ( ! this.down_point_while_move ) {
        return;
    }

    if ( ! this.model_selected ) {
        return;
    }

    var delta_x = ev.offsetX - this.down_point_while_move.offsetX;
    var delta_y = ev.offsetY - this.down_point_while_move.offsetY;

    new_x_offset = this.model_point_while_move_x + delta_x;
    new_y_offset = this.model_point_while_move_y + delta_y;

    this.model_selected.update_location(new_x_offset, new_y_offset);

    this.update();
};

/***
 *
 * 鼠标按下事件
 */
JEditor.prototype.onmousedown = function (ev) {
    var model = this.select_model(ev);
    if ( model ) {
        this.down_point_while_move = ev;
        this.model_selected = model;
        this.model_point_while_move_x = model.x_offset;
        this.model_point_while_move_y = model.y_offset;
    }
};

/***
 *
 * 鼠标弹起事件
 */
JEditor.prototype.onmouseup = function (ev) {
    var model = this.select_model(ev);
    this.model_selected = undefined;
    this.move_begin_point = undefined;
};

/***
 *
 * 鼠标单击事件
 */
JEditor.prototype.onclick = function (ev) {
    var model = this.select_model(ev);
};

/***
 *
 * 鼠标双击事件
 */
JEditor.prototype.ondblclick = function (ev) {
    var model = this.select_model(ev);
};
