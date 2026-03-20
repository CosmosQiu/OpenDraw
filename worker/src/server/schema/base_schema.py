from pydantic import BaseModel


class BaseDTO(BaseModel):
    model_config = {'from_attributes': True}
