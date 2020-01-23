import {
  Validator
} from 'jsonschema';
import 'should';
import rp from 'request-promise';
import '@babel/polyfill'

let validator, mainSchema;

function keys(obj) {
  const res = [];
  for (let i in obj) {
    res.push(i);
  }
  return res;
}


suite('Schema Validation Tests', () => {

  setup(async () => {
    mainSchema = require('../esySchema');
    validator = new Validator();
    validator.addSchema(mainSchema);
    async function importNextSchema() {
      const nextSchema = validator.unresolvedRefs.shift();
      if (!nextSchema) {
        return;
      }
      const newSchema = await rp({
        uri: nextSchema
      });
      const newSchemaParsed = JSON.parse(newSchema);
      validator.addSchema(newSchemaParsed, nextSchema);
      return await importNextSchema();
    }
    return await importNextSchema();
  })

  test('Existing npm packages should be validated properly', async () => {
    const data = require('./fixtures/validNpmList');
    const keysData = keys(data);
    return await Promise.all(keysData.map(async pack => {
      const link = data[pack];
      const jsonString = await rp(link);
      const packageObj = JSON.parse(jsonString);
      const errors = validator.validate(packageObj, mainSchema).errors;
      errors.should.be.empty();
    }));
  })

  test('Existing esy packages should be validated properly', async () => {
    const data = require('./fixtures/validEsyList');
    const keysData = keys(data);
    return await Promise.all(keysData.map(async pack => {
      const link = data[pack];
      const jsonString = await rp(link);
      const packageObj = JSON.parse(jsonString);
      const errors = validator.validate(packageObj, mainSchema).errors;
      errors.should.be.empty();
    }));
  })

  test('It should reject invalid packages', async () => {
    const data = require('./fixtures/invalid');
    return await Promise.all(data.map(async packageObj => {
      const errors = validator.validate(packageObj, mainSchema).errors;
      errors.should.not.be.empty();
    }));
  })
})