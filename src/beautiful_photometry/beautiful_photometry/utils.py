"""
Fuction to round-on-return

@param float value          The return value
@param boolean toround      Whether or not to round
@param int digits           The number of digits to round to.
                            Set digits=None to round to a whole number.

@return int/float           The value, potentially rounded
"""
def round_output(value, toround=True, digits=2):
    if toround:
        if digits is not None:
            return round(value, digits)
        else: 
            return int(round(value))
    else:
        return value