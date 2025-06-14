'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DIDMethod } from '@/types/did';
import { Key, Globe, Coins, Cloud, Users } from 'lucide-react';

interface DIDMethodSelectorProps {
  selectedMethod: DIDMethod | null;
  onMethodChange: (method: DIDMethod) => void;
  disabled?: boolean;
}

/**
 * DIDMethodSelector component allows users to choose DID method during creation
 * with detailed information about each method
 */
export function DIDMethodSelector({ selectedMethod, onMethodChange, disabled = false }: DIDMethodSelectorProps) {
  // DID method configurations
  const didMethods = [
    {
      id: 'key' as DIDMethod,
      name: 'DID:Key',
      icon: Key,
      description: 'Simple cryptographic key-based DID method',
      features: ['Self-sovereign', 'No blockchain required', 'Instant creation'],
      complexity: 'Simple',
      cost: 'Free',
      recommended: true,
      details: 'Perfect for basic authentication and signing. No external dependencies.'
    },
    {
      id: 'web' as DIDMethod,
      name: 'DID:Web',
      icon: Globe,
      description: 'Web-based DID method using domain names',
      features: ['Domain-based', 'Web infrastructure', 'Human-readable'],
      complexity: 'Medium',
      cost: 'Domain cost',
      recommended: false,
      details: 'Uses existing web infrastructure. Requires domain ownership and HTTPS.'
    },
    {
      id: 'ethr' as DIDMethod,
      name: 'DID:Ethr',
      icon: Coins,
      description: 'Ethereum blockchain-based DID method',
      features: ['Blockchain-based', 'Decentralized', 'Smart contracts'],
      complexity: 'Complex',
      cost: 'Gas fees',
      recommended: false,
      details: 'Leverages Ethereum blockchain for maximum decentralization. Requires ETH for transactions.'
    },
    {
      id: 'ion' as DIDMethod,
      name: 'DID:ION',
      icon: Cloud,
      description: 'Microsoft ION network DID method',
      features: ['Bitcoin anchored', 'Scalable', 'Enterprise-ready'],
      complexity: 'Complex',
      cost: 'Network fees',
      recommended: false,
      details: 'Built on Bitcoin blockchain with Layer 2 scaling. Enterprise-grade solution.'
    },
    {
      id: 'peer' as DIDMethod,
      name: 'DID:Peer',
      icon: Users,
      description: 'Peer-to-peer DID method for direct communication',
      features: ['P2P communication', 'No global registry', 'Privacy-focused'],
      complexity: 'Medium',
      cost: 'Free',
      recommended: false,
      details: 'Designed for peer-to-peer interactions without global registration.'
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose DID Method</h3>
        <p className="text-sm text-muted-foreground">
          Select the DID method that best fits your use case. Each method has different characteristics and requirements.
        </p>
      </div>

      <RadioGroup
        value={selectedMethod || ''}
        onValueChange={(value) => onMethodChange(value as DIDMethod)}
        disabled={disabled}
        className="space-y-3"
      >
        {didMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;

          return (
            <div key={method.id} className="relative">
              <Label
                htmlFor={method.id}
                className={`cursor-pointer block ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <Card className={`transition-all hover:shadow-md ${
                  isSelected 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:border-muted-foreground/50'
                } ${disabled ? 'pointer-events-none' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem
                        value={method.id}
                        id={method.id}
                        className="mt-1"
                        disabled={disabled}
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle className="text-base">{method.name}</CardTitle>
                          {method.recommended && (
                            <Badge variant="default" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">
                          {method.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {method.details}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {method.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between text-sm">
                        <div>
                          <span className="text-muted-foreground">Complexity: </span>
                          <span className={`font-medium ${
                            method.complexity === 'Simple' ? 'text-green-600' :
                            method.complexity === 'Medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {method.complexity}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cost: </span>
                          <span className={`font-medium ${
                            method.cost === 'Free' ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {method.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          );
        })}
      </RadioGroup>

      {selectedMethod && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Selected: {didMethods.find(m => m.id === selectedMethod)?.name}</h4>
          <p className="text-sm text-muted-foreground">
            {didMethods.find(m => m.id === selectedMethod)?.details}
          </p>
        </div>
      )}
    </div>
  );
}