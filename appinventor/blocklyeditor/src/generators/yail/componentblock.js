/* Copyright 2012 Massachusetts Institute of Technology. All rights reserved. */

/**
 * @fileoverview Generating Yail for component-related blocks.
 *
 * Code generation for component-related blocks works a little differently than for built-in
 * blocks. Since we create component instance blocks dynamically, as components are added to a
 * project, we also create their code generation blocks dynamically. The functions below return
 * functions to generate code for blocks of the appropriate types, binding in the names of
 * the component instances for which they are created. See blocklyeditor/src/component.js for the
 * code that uses these functions when new components are added to a project.
 * 
 * @author andrew.f.mckinney@gmail.com (Andrew F. McKinney)
 * @author sharon@google.com (Sharon Perl)
 */

Blockly.Yail = Blockly.Generator.get('Yail');

/**
 * Returns a function that takes no arguments, generates Yail for an event handler declaration block
 * and returns the generated code string.
 *
 * @param {String} instanceName the block's instance name, e.g., Button1
 * @param {String} eventName  the type of event, e.g., Click
 * @returns {Function} event code generation function with instanceName and eventName bound in
 */
Blockly.Yail.component_event = function() {
  var body = Blockly.Yail.statementToCode(this, 'DO', Blockly.Yail.ORDER_NONE);
  // TODO: handle deactivated block, null body
  if(body == ""){
    body = Blockly.Yail.YAIL_NULL;
  }

  var code = Blockly.Yail.YAIL_DEFINE_EVENT
    + this.getTitleValue("COMPONENT_SELECTOR")
    + Blockly.Yail.YAIL_SPACER
    + this.eventName
    + Blockly.Yail.YAIL_OPEN_COMBINATION
    // TODO: formal params go here
    + this.getVarString()
    + Blockly.Yail.YAIL_CLOSE_COMBINATION
    + Blockly.Yail.YAIL_SET_THIS_FORM
    + Blockly.Yail.YAIL_SPACER
    + body
    + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return code;
}

Blockly.Yail.component_method = function() {
  var methodHelperYailString = Blockly.Yail.methodHelper(this, (this.isGeneric ? this.typeName : this.instanceName), this.methodName, this.isGeneric);
  //if the method returns a value
  if(this.getMethodTypeObject().returnType) {
    return [methodHelperYailString, Blockly.Yail.ORDER_ATOMIC];
  } else {
    return methodHelperYailString;
  }
}

/**
 * Returns a function that generates Yail to call to a method with a return value. The generated
 * function takes no arguments and returns a 2-element Array with the method call code string
 * and the operation order Blockly.Yail.ORDER_ATOMIC.
 * 
 * @param {String} instanceName
 * @param {String} methodName
 * @returns {Function} method call generation function with instanceName and methodName bound in
 */
Blockly.Yail.methodWithReturn = function(instanceName, methodName) {
  return function() {
    return [Blockly.Yail.methodHelper(this, instanceName, methodName, false), 
            Blockly.Yail.ORDER_ATOMIC];
  }
}

/**
 * Returns a function that generates Yail to call to a method with no return value. The generated
 * function takes no arguments and returns the method call code string.
 * 
 * @param {String} instanceName
 * @param {String} methodName
 * @returns {Function} method call generation function with instanceName and methodName bound in
 */
Blockly.Yail.methodNoReturn = function(instanceName, methodName) {
  return function() {
    return Blockly.Yail.methodHelper(this, instanceName, methodName, false);
  }
}

/**
 * Returns a function that generates Yail to call to a generic method with a return value. 
 * The generated function takes no arguments and returns a 2-element Array with the method call 
 * code string and the operation order Blockly.Yail.ORDER_ATOMIC.
 * 
 * @param {String} instanceName
 * @param {String} methodName
 * @returns {Function} method call generation function with instanceName and methodName bound in
 */
Blockly.Yail.genericMethodWithReturn = function(typeName, methodName) {
  return function() {
    return [Blockly.Yail.methodHelper(this, typeName, methodName, true), Blockly.Yail.ORDER_ATOMIC];
  }
}

/**
 * Returns a function that generates Yail to call to a generic method with no return value. 
 * The generated function takes no arguments and returns the method call code string.
 * 
 * @param {String} instanceName
 * @param {String} methodName
 * @returns {Function} method call generation function with instanceName and methodName bound in
 */
Blockly.Yail.genericMethodNoReturn = function(typeName, methodName) {
  return function() {
    return Blockly.Yail.methodHelper(this, typeName, methodName, true);
  }
}

/**
 * Generate and return the code for a method call. The generated code is the same regardless of
 * whether the method returns a value or not.
 * @param {!Blockly.Block} methodBlock  block for which we're generating code
 * @param {String} name instance or type name
 * @param {String} methodName
 * @param {String} generic true if this is for a generic method block, false if for an instance
 * @returns {Function} method call generation function with instanceName and methodName bound in
 */
Blockly.Yail.methodHelper = function(methodBlock, name, methodName, generic) {

// TODO: the following line  may be a bit of a hack because it hard-codes "component" as the
// first argument type when we're generating yail for a generic block, instead of using
// type information associated with the socket. The component parameter is treated differently
// here than the other method parameters. This may be fine, but consider whether
// to get the type for the first socket in a more general way in this case. 
  var paramObjects = methodBlock.getMethodTypeObject().params;
  var numOfParams = paramObjects.length;
  var yailTypes = [];
  if(generic) {
    yailTypes.push(Blockly.Yail.YAIL_COMPONENT_TYPE);
  }
  for(var i=0;i<paramObjects.length;i++) {
    yailTypes.push(paramObjects[i].type);
  }
  //var yailTypes = (generic ? [Blockly.Yail.YAIL_COMPONENT_TYPE] : []).concat(methodBlock.yailTypes);
  var callPrefix;
  if (generic) {
    callPrefix = Blockly.Yail.YAIL_CALL_COMPONENT_TYPE_METHOD 
        // TODO(hal, andrew): check for empty socket and generate error if necessary
        + Blockly.Yail.valueToCode(methodBlock, 'COMPONENT', Blockly.Yail.ORDER_NONE)
        + Blockly.Yail.YAIL_SPACER;
  } else {
    callPrefix = Blockly.Yail.YAIL_CALL_COMPONENT_METHOD; 
    name = methodBlock.getTitleValue("COMPONENT_SELECTOR");
  }

  var args = [];
  for (var x = 0; x < numOfParams; x++) {
    // TODO(hal, andrew): check for empty socket and generate error if necessary
    args.push(Blockly.Yail.YAIL_SPACER 
              + Blockly.Yail.valueToCode(methodBlock, 'ARG' + x, Blockly.Yail.ORDER_NONE));
  }

  return callPrefix
    + Blockly.Yail.YAIL_QUOTE
    + name 
    + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE
    + methodName
    + Blockly.Yail.YAIL_SPACER 
    + Blockly.Yail.YAIL_OPEN_COMBINATION
    + Blockly.Yail.YAIL_LIST_CONSTRUCTOR
    + args.join(' ') 
    + Blockly.Yail.YAIL_CLOSE_COMBINATION
    + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE
    + Blockly.Yail.YAIL_OPEN_COMBINATION
    + yailTypes.join(' ') 
    + Blockly.Yail.YAIL_CLOSE_COMBINATION
    + Blockly.Yail.YAIL_CLOSE_COMBINATION;
}

Blockly.Yail.component_set_get = function() {
  if(this.setOrGet == "set") {
    if(this.isGeneric) {
      return Blockly.Yail.genericSetproperty.call(this);
    } else {
      return Blockly.Yail.setproperty.call(this);
    }
  } else {
    if(this.isGeneric) {
      return Blockly.Yail.genericGetproperty.call(this);
    } else {
      return Blockly.Yail.getproperty.call(this);
    }
  }
}

/**
 * Returns a function that takes no arguments, generates Yail code for setting a component property
 * and returns the code string.
 *
 * @param {String} instanceName
 * @returns {Function} property setter code generation function with instanceName bound in
 */
Blockly.Yail.setproperty = function() {
  var propertyName = this.getTitleValue("PROP");
  var propType = this.getPropertyObject(propertyName).type
  var assignLabel = Blockly.Yail.YAIL_QUOTE + this.getTitleValue("COMPONENT_SELECTOR") + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE + propertyName;
  var code = Blockly.Yail.YAIL_SET_AND_COERCE_PROPERTY + assignLabel + Blockly.Yail.YAIL_SPACER;
  // TODO(hal, andrew): check for empty socket and generate error if necessary
  code = code.concat(Blockly.Yail.valueToCode(this, 'VALUE', Blockly.Yail.ORDER_NONE /*TODO:?*/));
  code = code.concat(Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE
    + propType + Blockly.Yail.YAIL_CLOSE_COMBINATION);
  return code;
}


/**
 * Returns a function that takes no arguments, generates Yail code for setting a generic component's 
 * property and returns the code string.
 *
 * @param {String} instanceName
 * @returns {Function} property setter code generation function with instanceName bound in
 */
Blockly.Yail.genericSetproperty = function() {
  var propertyName = this.getTitleValue("PROP");
  var propType = this.getPropertyObject(propertyName).type;
  var assignLabel = Blockly.Yail.YAIL_QUOTE + this.typeName + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE + propertyName;
  var code = Blockly.Yail.YAIL_SET_AND_COERCE_COMPONENT_TYPE_PROPERTY
    // TODO(hal, andrew): check for empty socket and generate error if necessary
    + Blockly.Yail.valueToCode(this, 'COMPONENT', Blockly.Yail.ORDER_NONE)
    + Blockly.Yail.YAIL_SPACER
    + assignLabel
    + Blockly.Yail.YAIL_SPACER;
  // TODO(hal, andrew): check for empty socket and generate error if necessary
  code = code.concat(Blockly.Yail.valueToCode(this, 'VALUE', Blockly.Yail.ORDER_NONE /*TODO:?*/));
  code = code.concat(Blockly.Yail.YAIL_SPACER + Blockly.Yail.YAIL_QUOTE
    + propType + Blockly.Yail.YAIL_CLOSE_COMBINATION);
  return code;
}


/**
 * Returns a function that takes no arguments, generates Yail code for getting a component's 
 * property value and returns a 2-element array containing the property getter code string and the 
 * operation order Blockly.Yail.ORDER_ATOMIC.
 *
 * @param {String} instanceName
 * @returns {Function} property getter code generation function with instanceName bound in
 */
Blockly.Yail.getproperty = function(instanceName) {
  var propertyName = this.getTitleValue("PROP");
  var propType = this.getPropertyObject(propertyName).type;
  var code = Blockly.Yail.YAIL_GET_PROPERTY
    + Blockly.Yail.YAIL_QUOTE
    + this.getTitleValue("COMPONENT_SELECTOR")
    + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE
    + propertyName
    + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [code, Blockly.Yail.ORDER_ATOMIC];
}


/**
 * Returns a function that takes no arguments, generates Yail code for getting a generic component's 
 * property value and returns a 2-element array containing the property getter code string and the 
 * operation order Blockly.Yail.ORDER_ATOMIC.
 *
 * @param {String} instanceName
 * @returns {Function} property getter code generation function with instanceName bound in
 */
Blockly.Yail.genericGetproperty = function(typeName) {
  var propertyName = this.getTitleValue("PROP");
  var propType = this.getPropertyObject(propertyName).type;
  var code = Blockly.Yail.YAIL_GET_COMPONENT_TYPE_PROPERTY
    // TODO(hal, andrew): check for empty socket and generate error if necessary
    + Blockly.Yail.valueToCode(this, 'COMPONENT', Blockly.Yail.ORDER_NONE)
    + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE
    + this.typeName
    + Blockly.Yail.YAIL_SPACER
    + Blockly.Yail.YAIL_QUOTE
    + propertyName
    + Blockly.Yail.YAIL_CLOSE_COMBINATION;
  return [code, Blockly.Yail.ORDER_ATOMIC];
}



/**
 * Returns a function that takes no arguments, generates Yail to get the value of a component
 * object, and returns a 2-element array containing the component getter code and the operation
 * order Blockly.Yail.ORDER_ATOMIC.
 *
 * @param {String} instanceName
 * @returns {Function} component getter code generation function with instanceName bound in
 */
Blockly.Yail.component_component_block = function() {
  return [Blockly.Yail.YAIL_GET_COMPONENT + this.getTitleValue("COMPONENT_SELECTOR") + Blockly.Yail.YAIL_CLOSE_COMBINATION,
          Blockly.Yail.ORDER_ATOMIC];
}
